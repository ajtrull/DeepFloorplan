"""Simple upload-and-predict web app for DeepFloorplan.

Run:
    python webapp.py
Then open http://127.0.0.1:5000 in your browser.
"""

from __future__ import annotations

import base64
import io
import os
from flask import Flask, render_template_string, request
from PIL import Image

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 12 * 1024 * 1024

predictor = None

TEMPLATE = """
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>DeepFloorplan App</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 2rem auto; max-width: 1100px; }
    .row { display: flex; gap: 1rem; flex-wrap: wrap; }
    .card { border: 1px solid #ddd; border-radius: 8px; padding: 1rem; flex: 1; min-width: 280px; }
    img { width: 100%; border-radius: 6px; }
    .error { color: #b00020; font-weight: bold; }
  </style>
</head>
<body>
  <h1>DeepFloorplan Demo App</h1>
  <p>Upload a floor plan image and run segmentation with the pretrained model.</p>
  <form method="post" enctype="multipart/form-data">
    <input type="file" name="image" accept="image/*" required />
    <button type="submit">Run inference</button>
  </form>

  {% if error %}
    <p class="error">{{ error }}</p>
  {% endif %}

  {% if input_image and output_image %}
    <div class="row">
      <div class="card">
        <h3>Input</h3>
        <img src="data:image/png;base64,{{ input_image }}" alt="Input image" />
      </div>
      <div class="card">
        <h3>Predicted floorplan</h3>
        <img src="data:image/png;base64,{{ output_image }}" alt="Predicted image" />
      </div>
    </div>
  {% endif %}
</body>
</html>
"""


def _to_b64_png(image: Image.Image) -> str:
    buf = io.BytesIO()
    image.save(buf, format="PNG")
    return base64.b64encode(buf.getvalue()).decode("utf-8")


@app.route("/", methods=["GET", "POST"])
def index():
    global predictor
    error = None
    input_b64 = None
    output_b64 = None

    if request.method == "POST":
        f = request.files.get("image")
        if f is None or f.filename == "":
            error = "Please upload an image file."
        else:
            try:
                source_image = Image.open(f.stream).convert("RGB")
                input_b64 = _to_b64_png(source_image)

                if predictor is None:
                    from inference import DeepFloorplanPredictor

                    predictor = DeepFloorplanPredictor(
                        checkpoint_prefix=os.getenv("DEEPFLOORPLAN_CHECKPOINT", "./pretrained/pretrained_r3d")
                    )
                predicted = predictor.predict(source_image)
                output_b64 = _to_b64_png(Image.fromarray(predicted, mode="RGB"))
            except Exception as exc:  # keep app alive and show actionable error to user
                error = str(exc)

    return render_template_string(
        TEMPLATE, error=error, input_image=input_b64, output_image=output_b64
    )


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)
