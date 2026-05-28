"""
Macro runner — executes a JSON-defined sequence of actions on the console.

Macro JSON format:
{
  "name": "My Macro",
  "description": "Optional description",
  "steps": [
    {"action": "button",   "button": "A",    "duration": 0.1},
    {"action": "wait",     "seconds": 1.5},
    {"action": "navigate", "direction": "down", "steps": 3, "delay": 0.3},
    {"action": "media",    "command": "play"},
    {"action": "volume",   "direction": "up",  "times": 3}
  ]
}
"""

import asyncio
import json
from pathlib import Path
from typing import Union

from xbox.sg.console import Console
from xbox_tool.input import GameInput
from xbox_tool.media import MediaControl


class MacroRunner:
    def __init__(self, console: Console):
        self._input = GameInput(console)
        self._media = MediaControl(console)

    async def run_file(self, path: Union[str, Path]) -> None:
        macro = json.loads(Path(path).read_text())
        name = macro.get("name", str(path))
        print(f"Running macro: {name}")
        await self._run_steps(macro["steps"])
        print(f"Macro '{name}' complete.")

    async def run_steps(self, steps: list) -> None:
        await self._run_steps(steps)

    async def _run_steps(self, steps: list) -> None:
        for i, step in enumerate(steps):
            action = step.get("action", "").lower()
            try:
                await self._dispatch(action, step)
            except Exception as e:
                raise RuntimeError(f"Step {i + 1} ({action}) failed: {e}") from e

    async def _dispatch(self, action: str, step: dict) -> None:
        if action == "button":
            await self._input.press(step["button"], duration=step.get("duration", 0.1))

        elif action == "hold":
            await self._input.hold(step["button"], duration=step.get("duration", 1.0))

        elif action == "navigate":
            await self._input.navigate(
                step["direction"],
                steps=step.get("steps", 1),
                delay=step.get("delay", 0.3),
            )

        elif action == "sequence":
            await self._input.sequence(*step["buttons"], delay=step.get("delay", 0.3))

        elif action == "wait":
            await asyncio.sleep(step.get("seconds", 1.0))

        elif action == "media":
            cmd = step["command"].lower().replace("_", "").replace(" ", "")
            media_map = {
                "play":       self._media.play,
                "pause":      self._media.pause,
                "playpause":  self._media.play_pause,
                "stop":       self._media.stop,
                "next":       self._media.next_track,
                "nexttrack":  self._media.next_track,
                "prev":       self._media.prev_track,
                "prevtrack":  self._media.prev_track,
                "fastforward":self._media.fast_forward,
                "rewind":     self._media.rewind,
                "channelup":  self._media.channel_up,
                "channeldown":self._media.channel_down,
            }
            if cmd not in media_map:
                raise ValueError(f"Unknown media command '{step['command']}'")
            await media_map[cmd]()

        elif action == "volume":
            direction = step.get("direction", "up").lower()
            times = step.get("times", 1)
            fn = self._media.volume_up if direction == "up" else self._media.volume_down
            for _ in range(times):
                await fn()
                await asyncio.sleep(0.1)

        elif action == "seek":
            await self._media.seek(step["position"])

        else:
            raise ValueError(f"Unknown action '{action}'")
