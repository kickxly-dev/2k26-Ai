"""
Gamepad input and UI navigation.

Sends virtual controller button presses over SmartGlass. Works for UI navigation
and most in-game inputs. Duration controls how long the button is held.
"""

import asyncio
from typing import Union

from xbox.sg.console import Console
from xbox.sg.enum import GamePadButton


# Human-friendly button name aliases
BUTTON_ALIASES: dict[str, GamePadButton] = {
    "a":          GamePadButton.A,
    "b":          GamePadButton.B,
    "x":          GamePadButton.X,
    "y":          GamePadButton.Y,
    "up":         GamePadButton.DPadUp,
    "down":       GamePadButton.DPadDown,
    "left":       GamePadButton.DPadLeft,
    "right":      GamePadButton.DPadRight,
    "dpadup":     GamePadButton.DPadUp,
    "dpaddown":   GamePadButton.DPadDown,
    "dpadleft":   GamePadButton.DPadLeft,
    "dpadright":  GamePadButton.DPadRight,
    "lb":         GamePadButton.LeftBumper,
    "rb":         GamePadButton.RightBumper,
    "lt":         GamePadButton.LeftThumb,
    "rt":         GamePadButton.RightThumb,
    "menu":       GamePadButton.Menu,
    "view":       GamePadButton.View,
    "nexus":      GamePadButton.Nexus,
    "home":       GamePadButton.Nexus,
}


def resolve_button(name: Union[str, GamePadButton]) -> GamePadButton:
    if isinstance(name, GamePadButton):
        return name
    key = name.lower().replace(" ", "").replace("_", "")
    if key not in BUTTON_ALIASES:
        raise ValueError(
            f"Unknown button '{name}'. Valid options: {', '.join(BUTTON_ALIASES)}"
        )
    return BUTTON_ALIASES[key]


class GameInput:
    """Sends gamepad inputs to a connected Xbox console."""

    def __init__(self, console: Console):
        self._console = console

    async def press(self, button: Union[str, GamePadButton], duration: float = 0.1) -> None:
        """Press and release a button. Duration is how long it's held (seconds)."""
        btn = resolve_button(button)
        await self._console.gamepad_input(btn)
        await asyncio.sleep(max(duration, 0.05))
        await self._console.gamepad_input(GamePadButton.Clear)
        await asyncio.sleep(0.05)

    async def hold(self, button: Union[str, GamePadButton], duration: float = 1.0) -> None:
        """Hold a button down for a longer period (e.g. holding B to go back faster)."""
        await self.press(button, duration=duration)

    async def sequence(self, *buttons: Union[str, GamePadButton], delay: float = 0.3) -> None:
        """Press a sequence of buttons with a fixed delay between each."""
        for btn in buttons:
            await self.press(btn)
            await asyncio.sleep(delay)

    async def navigate(self, direction: str, steps: int = 1, delay: float = 0.3) -> None:
        """Move the cursor in a direction N times."""
        for _ in range(steps):
            await self.press(direction)
            await asyncio.sleep(delay)
