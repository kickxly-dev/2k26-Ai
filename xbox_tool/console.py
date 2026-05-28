"""
Xbox SmartGlass console connection manager.

Uses the LAN-based SmartGlass protocol that Xbox exposes on your local network.
The console must have "Allow connections from any device" enabled under
Settings > Devices & connections > Remote features.
"""

import asyncio
from typing import Optional, List

from xbox.sg.console import Console
from xbox.sg.manager import Manager
from xbox.sg.enum import ConnectionState


class XboxConsole:
    """Manages a SmartGlass connection to a single Xbox console."""

    def __init__(self, ip_address: Optional[str] = None, live_token: Optional[str] = None):
        self.ip_address = ip_address
        self.live_token = live_token
        self._console: Optional[Console] = None

    @property
    def console(self) -> Console:
        if self._console is None:
            raise RuntimeError("Not connected. Call connect() first.")
        return self._console

    @property
    def connected(self) -> bool:
        return (
            self._console is not None
            and self._console.connection_state == ConnectionState.Connected
        )

    async def discover(self, timeout: float = 5.0) -> List[Console]:
        """Find all Xbox consoles on the local network."""
        consoles = await Console.discover(timeout=timeout)
        return consoles

    async def connect(self, timeout: float = 10.0) -> None:
        """
        Connect to the Xbox console.

        If ip_address was provided, connects directly. Otherwise, auto-discovers
        the first console found on the LAN.
        """
        if self.ip_address:
            consoles = await Console.discover(addr=self.ip_address, timeout=timeout)
            if not consoles:
                # Try a direct connect without discovery broadcast
                self._console = Console(self.ip_address, name="Xbox", uuid=None,
                                        flags=0, last_error=0, public_key=None)
            else:
                self._console = consoles[0]
        else:
            consoles = await self.discover(timeout=timeout)
            if not consoles:
                raise ConnectionError(
                    "No Xbox found on the network. Make sure Remote Features are enabled on your console."
                )
            self._console = consoles[0]

        state = await self._console.connect(userhash=None, xsts_token=self.live_token)
        if state != ConnectionState.Connected:
            raise ConnectionError(f"Failed to connect. State: {state}")
        print(f"Connected to {self._console.name} ({self._console.address})")

    async def disconnect(self) -> None:
        if self._console:
            await self._console.disconnect()
            self._console = None

    async def __aenter__(self):
        await self.connect()
        return self

    async def __aexit__(self, *_):
        await self.disconnect()
