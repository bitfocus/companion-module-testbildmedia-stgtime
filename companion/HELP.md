## STGTIME

This module controls a STGTIME stage timer through its REST API.

### Setup

Enter the STGTIME hostname or IP address, HTTP port, and device API token. The token is shown in **System → API → Show token** in the STGTIME Web GUI.

The module polls live state and exposes timer, message, video, display, and device variables. A 500 ms polling interval is recommended.

The **Live display image** feedback and matching layered preset show the same pixel-exact 64×32 framebuffer used by the Web GUI. The timer toggle and the separate live-time indicator are independent presets; the indicator is red while stopped and green while running.

The supplied button presets use Companion 5 layered graphics so that each regular button contains only a background and text layer, while the live display contains only an image layer.

### Actions

- Start, stop, toggle, and reset the timer
- Select countdown or stopwatch mode
- Set or adjust time and configure overtime
- Set timer thresholds, colors, and end blinking
- Load presets stored on STGTIME
- Set or show/hide the message area
- Send generic video remaining-time data from vMix, VLC, ProPresenter, or another Companion connection; text and time fields accept Companion variables
- Change brightness, clock visibility/color, and time format

### Security

The API token is used only for requests to the configured STGTIME. Password, network, and software-update functions are intentionally not exposed as Companion actions.
