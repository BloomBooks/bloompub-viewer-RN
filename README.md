# Getting Started

yarn
yarn start

# Running the app on your phone

## One-Time Setup

- Install "Expo" app (Android) or "Expo Go" app (iOS)
- (If needed) Modify Network settings according to https://stackoverflow.com/questions/47966887/expo-lan-configuration-doesnt-work-for-new-reactnative-project (Ensure "Private" not "Public", change IPv4 Interface Metric to 5 instead of 4.
- If needed, Restart server, Expo Go app, and re-scan QR code)

## Build loop

- Ensure Expo server running on dev machine (yarn start)
- Open Expo app on phone
- On the phone, scan the QR code that the Expo server on the dev machine printed out.
  Or, if you've already done this, just select it from the list of recents
- If working, it should say "Bundling" and shortly thereafter the app should start running on the phone.

## Troubleshooting

- Error in network response: Ensure network settings correct (see one-time setup)
- "Cannot connect to Metro": It times out really quickly. Reload the app on your phone.
