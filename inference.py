"""Inference utilities for running DeepFloorplan on a single image.

This module keeps TensorFlow 1.x style graph/session usage behind a small API so it
can be reused by CLI or web application entry points.
"""

from __future__ import annotations

from pathlib import Path
from typing import Dict, Tuple

import numpy as np
from PIL import Image
import tensorflow.compat.v1 as tf


tf.disable_v2_behavior()

FLOORPLAN_MAP: Dict[int, Tuple[int, int, int]] = {
    0: (255, 255, 255),  # background
    1: (192, 192, 224),  # closet
    2: (192, 255, 255),  # bathroom/washroom
    3: (224, 255, 192),  # livingroom/kitchen/dining room
    4: (255, 224, 128),  # bedroom
    5: (255, 160, 96),   # hall
    6: (255, 224, 224),  # balcony
    7: (255, 255, 255),  # not used
    8: (255, 255, 255),  # not used
    9: (255, 60, 128),   # door & window
    10: (0, 0, 0),       # wall
}


class DeepFloorplanPredictor:
    """Loads a pretrained graph and predicts room/wall segmentation for an image."""

    def __init__(self, checkpoint_prefix: str = "./pretrained/pretrained_r3d") -> None:
        self.checkpoint_prefix = checkpoint_prefix
        self.meta_path = checkpoint_prefix + ".meta"
        self._graph = tf.Graph()
        self._session = None
        self._x = None
        self._room_type = None
        self._room_boundary = None

    def load(self) -> None:
        if self._session is not None:
            return

        checkpoint = Path(self.checkpoint_prefix)
        meta = Path(self.meta_path)
        if not checkpoint.exists() or not meta.exists():
            raise FileNotFoundError(
                "Pretrained weights not found. Download model files into './pretrained' "
                "(see pretrained/download_links.txt)."
            )

        with self._graph.as_default():
            session = tf.Session(graph=self._graph)
            session.run(
                tf.group(tf.global_variables_initializer(), tf.local_variables_initializer())
            )
            saver = tf.train.import_meta_graph(str(meta))
            saver.restore(session, str(checkpoint))

            self._x = self._graph.get_tensor_by_name("inputs:0")
            self._room_type = self._graph.get_tensor_by_name("Cast:0")
            self._room_boundary = self._graph.get_tensor_by_name("Cast_1:0")
            self._session = session

    def predict(self, image: Image.Image) -> np.ndarray:
        """Returns a colorized floorplan segmentation in uint8 RGB format."""
        self.load()
        model_input = self._preprocess(image)

        room_type, room_boundary = self._session.run(
            [self._room_type, self._room_boundary],
            feed_dict={self._x: model_input.reshape(1, 512, 512, 3)},
        )
        room_type = np.squeeze(room_type)
        room_boundary = np.squeeze(room_boundary)

        floorplan = room_type.copy()
        floorplan[room_boundary == 1] = 9
        floorplan[room_boundary == 2] = 10

        return self._ind2rgb(floorplan)

    @staticmethod
    def _preprocess(image: Image.Image) -> np.ndarray:
        resized = image.convert("RGB").resize((512, 512), Image.BILINEAR)
        return np.asarray(resized, dtype=np.float32) / 255.0

    @staticmethod
    def _ind2rgb(indexed_image: np.ndarray) -> np.ndarray:
        rgb = np.zeros((indexed_image.shape[0], indexed_image.shape[1], 3), dtype=np.uint8)
        for label, color in FLOORPLAN_MAP.items():
            rgb[indexed_image == label] = color
        return rgb
