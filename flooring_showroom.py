"""Flooring Showroom Display Program.

This program provides a simple command line interface for browsing
available flooring options, adding new options, and calculating an
estimated cost based on square footage.
"""

from dataclasses import dataclass, field
from typing import List

@dataclass
class FlooringOption:
        name: str
        price_per_sqft: float
        colors: List[str] = field(default_factory=list)

        def __str__(self):
                color_list = ', '.join(self.colors) if self.colors else 'N/A'
                return f"{self.name} - ${self.price_per_sqft:.2f}/sqft - Colors: {color_list}"

def display_options(options):
        print("\nFlooring Options:")
        for idx, option in enumerate(options, 1):
                print(f"{idx}. {option}")

def add_option(options):
        name = input("Enter flooring name: ")
        try:
                price = float(input("Enter price per square foot: "))
        except ValueError:
                print("Invalid price.")
                return
        colors = [c.strip() for c in input("Enter available colors (comma separated): ").split(',') if c.strip()]
        options.append(FlooringOption(name, price, colors))
        print("Option added.\n")

def calculate_cost(options):
        if not options:
                print("No flooring options available.")
                return
        display_options(options)
        try:
                idx = int(input("Select option by number: ")) - 1
                sqft = float(input("Enter square footage: "))
        except ValueError:
                print("Invalid input.")
                return
        if 0 <= idx < len(options):
                cost = sqft * options[idx].price_per_sqft
                print(f"Estimated cost: ${cost:.2f}\n")
        else:
                print("Invalid option.\n")

def main():
        options = [
                FlooringOption("Hardwood", 5.50, ["Oak", "Walnut", "Maple"]),
                FlooringOption("Carpet", 2.25, ["Beige", "Gray", "Blue"]),
                FlooringOption("Tile", 4.00, ["White", "Black", "Marble"])
        ]
        while True:
                print("\nFlooring Showroom Menu:")
                print("1. View Flooring Options")
                print("2. Add Flooring Option")
                print("3. Calculate Cost")
                print("4. Exit")
                choice = input("Select an option: ")
                if choice == "1":
                        display_options(options)
                elif choice == "2":
                        add_option(options)
                elif choice == "3":
                        calculate_cost(options)
                elif choice == "4":
                        print("Goodbye!")
                        break
                else:
                        print("Invalid choice. Try again.\n")

if __name__ == "__main__":
        main()
