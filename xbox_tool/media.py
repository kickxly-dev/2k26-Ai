"""
Media playback control (video, music, streaming apps).
"""

from xbox.sg.console import Console
from xbox.sg.enum import MediaControlCommand, VolumeDirection


class MediaControl:
    """Controls media playback on a connected Xbox console."""

    def __init__(self, console: Console):
        self._console = console

    async def play(self) -> None:
        await self._console.media_command(0, MediaControlCommand.Play, 0)

    async def pause(self) -> None:
        await self._console.media_command(0, MediaControlCommand.Pause, 0)

    async def play_pause(self) -> None:
        await self._console.media_command(0, MediaControlCommand.PlayPause, 0)

    async def stop(self) -> None:
        await self._console.media_command(0, MediaControlCommand.Stop, 0)

    async def next_track(self) -> None:
        await self._console.media_command(0, MediaControlCommand.NextTrack, 0)

    async def prev_track(self) -> None:
        await self._console.media_command(0, MediaControlCommand.PreviousTrack, 0)

    async def fast_forward(self) -> None:
        await self._console.media_command(0, MediaControlCommand.FastForward, 0)

    async def rewind(self) -> None:
        await self._console.media_command(0, MediaControlCommand.Rewind, 0)

    async def seek(self, position_seconds: int) -> None:
        """Seek to an absolute position (in seconds)."""
        await self._console.media_command(0, MediaControlCommand.Seek, position_seconds)

    async def volume_up(self) -> None:
        await self._console.volume_command(VolumeDirection.Up)

    async def volume_down(self) -> None:
        await self._console.volume_command(VolumeDirection.Down)

    async def channel_up(self) -> None:
        await self._console.media_command(0, MediaControlCommand.ChannelUp, 0)

    async def channel_down(self) -> None:
        await self._console.media_command(0, MediaControlCommand.ChannelDown, 0)
