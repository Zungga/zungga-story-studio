# Zungga Story Studio: Requirements and First Story

A tiny web tool that plays a story as a 3D animated scene with an ElevenLabs voiceover, and records it as a ready-to-post MP4.

## 1. Goal

Make one story video alone, in a few hours, with no editor or animator. Then reuse the same tool for every future story. The output is used for social media (Reels, Shorts) and inside the Zungga app.

## 2. How it works

A story is a **data file**, not a video. The studio reads the file, builds the 3D scene, plays the camera moves, speaks each narration line with ElevenLabs, and records everything as one MP4. A new story only needs a new file.

## 3. What the studio must do (Version 1)

1. **Load a story file** (JSON) with scenes: narration text, props on screen, camera move, counters, on-screen text.
2. **Render 3D props** with Three.js in a flat, playful style matching Zungga colours (Fredoka for text).
3. **Camera moves** per scene: push-in, pull-back, pan, orbit, top-down, hold. Speed and angle are settable in the file.
4. **Voiceover** through ElevenLabs: generate each scene's audio once, save it, and reuse it. No repeat charges on replays.
5. **Timing:** each scene lasts as long as its voice clip plus a small pause, so picture and voice stay in sync.
6. **On-screen numbers and text:** animated counters (for example ₹100 to ₹30) and large captions, safe from the edges of a vertical screen.
7. **Preview and play controls:** play, pause, jump to scene, replay a single scene.
8. **Record and export:** one button records the canvas and the voice together and downloads the video at 1080 x 1920 (9:16), 30 fps. Modern Chrome can save MP4 directly. If MP4 is not available, it saves WebM and the tool converts it to MP4, or you can convert it with CapCut or HandBrake.
9. **Asset storage:** props, voice clips, story files and exported videos all live in one project folder with clear names (for example `stories/pocket-money/`), backed up daily.

## 4. Version 2 and 3 (later)

- **Version 2:** a simple editor for camera and timing with sliders, a reusable prop library, background music with automatic volume lowering under the voice, auto-captions.
- **Version 3:** the app's own player (shorts and stories pages), multiple voices and languages, a library of finished stories, one-click export for Reels, Shorts, and in-app use.

## 5. Safety and trust

- **Never put the ElevenLabs key in a public web page.** Run the studio on your own computer, or call ElevenLabs through a small private backend. Keep the key in a private settings file, never in the page code.
- **No faces and no personal names** in any story. Use "I", relationships (my parents, my friend, my class teacher) and professions (the shopkeeper).
- Check every generated voice line by listening before exporting.
- Keep a copy of every asset locally, and a second copy in cloud storage.

## 6. Story file format (example)

```json
{
  "title": "My Parents Gave Me Pocket Money",
  "format": { "width": 1080, "height": 1920, "fps": 30 },
  "voice": { "provider": "elevenlabs", "voiceId": "YOUR_VOICE_ID" },
  "scenes": [
    {
      "id": 1,
      "narration": "My parents gave me pocket money, and by Wednesday itself, it was gone.",
      "props": ["note_100"],
      "camera": { "move": "push_in", "from": "wide", "to": "close" },
      "counter": { "from": 100, "to": 100 }
    },
    {
      "id": 2,
      "narration": "When I think about where I spent it? On Monday, I bought chips during recess. ...",
      "props": ["chips", "juice", "note_100"],
      "camera": { "move": "pan", "direction": "left_to_right" },
      "counter": { "from": 100, "to": 30 }
    }
  ]
}
```

## 7. First story: "My Parents Gave Me Pocket Money"

Length: about 80 seconds. Style: first person, Indian tone in the phrasing, neutral everyday details. No faces, no names.

**Scene 1: Hook**

- Narration: "My parents gave me pocket money, and by Wednesday itself, it was gone."
- Props: a ₹100 note. Camera: slow push-in.

**Scene 2: Where it went**

- Narration: "When I think about where I spent it? On Monday, I bought chips during recess. On Tuesday, I wanted something to drink with them, so I bought juice. By Wednesday, my hundred rupees had become only thirty."
- Props: chips packet, juice box, note. Camera: pan across, then top-down on the counter. Counter: ₹100 to ₹30.

**Scene 3: The dream**

- Narration: "And the sad part? I was saving for a football of one hundred and fifty rupees."
- Props: a football with a ₹150 tag. Camera: slow orbit.

**Scene 4: The pause**

- Narration: "What do you do when the money is gone, but the dream is still there? I did not know. I just sat on the bench, looking at my thirty rupees."
- Props: a bench, a ₹30 note. Camera: slow pull-back.

**Scene 5: Test day**

- Narration: "Then came Friday, the day of the unit test. When my class teacher entered with the question papers, I heard whispering all over the class. Half the students had forgotten their pencils."
- Props: desks, empty pencil boxes, a classroom door. Camera: wide shot, then slow dolly forward.

**Scene 6: The idea**

- Narration: "And that moment, an idea came. What if someone's problem is my chance?"
- Props: lightbulb above the ₹30 note. Camera: quick push-in. On-screen text: "Someone's problem = my chance".

**Scene 7: The shop**

- Narration: "After school, I ran to the stationery shop. Pencils were three rupees each. I gave the shopkeeper my thirty rupees and took ten pencils."
- Props: shop counter, ten pencils. Camera: low angle, then hold. Counter: ₹30 to ₹0.

**Scene 8: The sale**

- Narration: "The next morning, I sold them to my classmates for five rupees each. My best friend was the first to buy. By the second day, my thirty rupees had become fifty."
- Props: pencils passing from hand to hand, coins dropping into a box. Camera: top-down. Counter: ₹0 to ₹50.

**Scene 9: The lesson**

- Narration: "When I think about what I learned? I did not need big money. I only needed to notice what the people around me needed."
- Props: a single pencil in soft light. Camera: slow, calm hold.

**Scene 10: The question**

- Narration: "So now I ask you the same thing I asked myself. What do the people around you keep needing?"
- On-screen text: "What do the people around you keep needing?", then the Zungga logo.

## 8. Done when (acceptance checklist)

- The first story plays start to finish with voice and camera moves in sync.
- One click records and downloads a 1080 x 1920 video with clear audio.
- The video opens and plays on a phone and uploads to Instagram and YouTube without errors.
- Voice clips are saved so replays cost nothing.
- All files for the story sit in one folder and are backed up.
- A second story can be made by writing only a new story file.

## 9. Risks and how to handle them

- **3D look is too plain:** keep the style flat and colourful, use good lighting, and add motion to every scene.
- **Voice sounds flat:** try two or three ElevenLabs voices and settings, and pick the warmest. Your own voice is also an option.
- **MP4 export differs by browser:** use current Chrome, and keep the WebM-to-MP4 fallback.
- **Scope grows too fast:** finish Version 1 with this one story before adding any editor features.
