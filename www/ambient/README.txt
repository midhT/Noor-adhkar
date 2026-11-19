Ambient sounds for the Quran player.

Add seamless-loop recordings (mp3/ogg, about 60-120 seconds, mono or stereo, ~96-128 kbps) to this folder,
then list each one in manifest.json:

{
  "sounds": [
    { "id": "rain",  "name": "Rain",  "file": "rain.mp3",  "icon": "rain",  "volume": 0.6, "credit": "Author, licence, source URL" },
    { "id": "birds", "name": "Birds", "file": "birds.mp3", "icon": "birds", "volume": 0.5, "credit": "..." }
  ]
}

icon is one of: rain, birds, wind, ocean, fire, night, forest, stream.
With no entries the Ambient button stays hidden in the player. Only add recordings you are licensed to ship.
