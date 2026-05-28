"""
CLI entry point. Usage: python -m xbox_tool <command> [options]
"""

import asyncio
import click

from xbox_tool.console import XboxConsole
from xbox_tool.input import GameInput, BUTTON_ALIASES
from xbox_tool.media import MediaControl
from xbox_tool.macros import MacroRunner


def run(coro):
    return asyncio.run(coro)


@click.group()
def cli():
    """Xbox automation tool — control your Xbox over the local network."""


# ── discover ──────────────────────────────────────────────────────────────────

@cli.command()
@click.option("--timeout", default=5.0, show_default=True, help="Discovery timeout (seconds)")
def discover(timeout):
    """Scan the local network for Xbox consoles."""
    async def _discover():
        xbox = XboxConsole()
        consoles = await xbox.discover(timeout=timeout)
        if not consoles:
            click.echo("No Xbox consoles found.")
        for c in consoles:
            click.echo(f"  {c.name:30s}  {c.address}")
    run(_discover())


# ── button ────────────────────────────────────────────────────────────────────

@cli.command()
@click.argument("button", type=click.Choice(list(BUTTON_ALIASES), case_sensitive=False))
@click.option("--ip", envvar="XBOX_IP", required=True, help="Console IP (or set XBOX_IP)")
@click.option("--duration", default=0.1, show_default=True, help="Hold duration in seconds")
@click.option("--token", envvar="XBOX_TOKEN", default=None, help="Xbox Live XSTS token")
def button(button, ip, duration, token):
    """Press a single button on the controller."""
    async def _press():
        async with XboxConsole(ip_address=ip, live_token=token) as xbox:
            await GameInput(xbox.console).press(button, duration=duration)
    run(_press())


# ── navigate ──────────────────────────────────────────────────────────────────

@cli.command()
@click.argument("direction", type=click.Choice(["up", "down", "left", "right"], case_sensitive=False))
@click.option("--steps", default=1, show_default=True, help="Number of times to move")
@click.option("--ip", envvar="XBOX_IP", required=True)
@click.option("--token", envvar="XBOX_TOKEN", default=None)
def navigate(direction, steps, ip, token):
    """Move the UI cursor in a direction."""
    async def _nav():
        async with XboxConsole(ip_address=ip, live_token=token) as xbox:
            await GameInput(xbox.console).navigate(direction, steps=steps)
    run(_nav())


# ── media ─────────────────────────────────────────────────────────────────────

MEDIA_COMMANDS = ["play", "pause", "play_pause", "stop", "next", "prev",
                  "fast_forward", "rewind", "volume_up", "volume_down",
                  "channel_up", "channel_down"]


@cli.command()
@click.argument("command", type=click.Choice(MEDIA_COMMANDS, case_sensitive=False))
@click.option("--ip", envvar="XBOX_IP", required=True)
@click.option("--token", envvar="XBOX_TOKEN", default=None)
@click.option("--seek-to", default=None, type=int, help="Seek position in seconds (seek command only)")
def media(command, ip, token, seek_to):
    """Send a media playback command."""
    async def _media():
        async with XboxConsole(ip_address=ip, live_token=token) as xbox:
            mc = MediaControl(xbox.console)
            cmd_map = {
                "play":         mc.play,
                "pause":        mc.pause,
                "play_pause":   mc.play_pause,
                "stop":         mc.stop,
                "next":         mc.next_track,
                "prev":         mc.prev_track,
                "fast_forward": mc.fast_forward,
                "rewind":       mc.rewind,
                "volume_up":    mc.volume_up,
                "volume_down":  mc.volume_down,
                "channel_up":   mc.channel_up,
                "channel_down": mc.channel_down,
            }
            if command == "seek" and seek_to is not None:
                await mc.seek(seek_to)
            else:
                await cmd_map[command]()
    run(_media())


# ── macro ─────────────────────────────────────────────────────────────────────

@cli.command()
@click.argument("macro_file", type=click.Path(exists=True))
@click.option("--ip", envvar="XBOX_IP", required=True)
@click.option("--token", envvar="XBOX_TOKEN", default=None)
def macro(macro_file, ip, token):
    """Run a JSON macro file on the console."""
    async def _macro():
        async with XboxConsole(ip_address=ip, live_token=token) as xbox:
            await MacroRunner(xbox.console).run_file(macro_file)
    run(_macro())


if __name__ == "__main__":
    cli()
