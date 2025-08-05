# companion-module-testbildmedia-stgtime

# Getting started

Executing a `npm install` command should perform all necessary steps to develop the module.

**Available Actions**
* Set Display Brightness
* Time/Clock set Color
* Timer Actions (Start/Stop/Toggle/Reset)
* Timer set Colors (Base/Warning/Ending Color & Blanking)
* Timer set Time (Set/Jog)
* Timer set Timings for Colors (Warning/Ending Time)
* Video set Colors (Base/Warning/Ending Color & Blanking)
* Video set Time (Remaining/Total)
* Video set Timings for Colors (Warning/Ending Time)
* Video Timer Visible (Show/Hide/Toggle)

**Available Feedback**
* Display Live View
* Timer set Time compare
* Timer running
* Timer stopped
* Video Timer Visible

**Available Variables**
* Display Brightness
* TIMER duration time in seconds
* Timer remaining time in HH:MM:SS

**Available Presets**
* Timer Toggle (with Feedback)
* Timer Start/Stop/Reset
* Timer Jog (-60s, -10s, +10s & +60s)
* Timer set Time (5, 10, 15, 20, 30, 45 & 60min. with Feedback)
* Video Timer Visible Toggle (with Feedback)
* Display Brightness (-10% & +10%)
* Live Image Viewer

For Video Timer you have to set Duration Time (Total Length of Video) and the Remaining Time, because the Server is calculating the Progressbars himself.

## Changes

### v0.0.2
- Module passed first tests with STGTIME v0.0.2