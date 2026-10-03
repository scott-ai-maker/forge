import os
import time
from pathlib import Path
from google import genai
from google.genai import types

def load_env():
    env_file = Path('.env.local')
    if not env_file.exists():
        return
    for line in env_file.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith('#'):
            continue
        if '=' in line:
            k, v = line.split('=', 1)
            os.environ[k.strip()] = v.strip()

load_env()
api_key = os.environ.get('GEMINI_API_KEY')
if not api_key:
    print("❌ Missing GEMINI_API_KEY")
    exit(1)

client = genai.Client(api_key=api_key)

image_path = Path("public/images/exercises/barbell-deadlift.jpg")
if not image_path.exists():
    print(f"❌ Cannot find {image_path}")
    exit(1)

print(f"📸 Reading starting frame: {image_path}...")
with open(image_path, "rb") as f:
    image_bytes = f.read()

prompt = (
    "A continuous, unbroken shot of the athletic athlete in the image performing a textbook clinical barbell deadlift. "
    "Starting from the starting wedge position shown in the image, the athlete braces their core, drives their feet through the floor, "
    "and smoothly stands up to full hip and knee lockout with tight glutes. The athlete then hinges at the hips to lower the loaded barbell "
    "smoothly and under control back down to the floor. Maintain the exact luxury dark navy and gold facility lighting, camera angle, and aesthetic."
)

print("🚀 Requesting video generation with Veo 2.0 (veo-2.0-generate-001)...")
try:
    operation = client.models.generate_videos(
        model="veo-2.0-generate-001",
        prompt=prompt,
        image=types.Image(image_bytes=image_bytes, mime_type="image/jpeg"),
        config=types.GenerateVideosConfig(
            aspect_ratio="1:1",
            duration_seconds=5,
            person_generation="ALLOW_ADULT"
        )
    )
    print(f"⏳ Operation created: {operation.name}. Polling for completion...")
    
    while not operation.done:
        print("  ⏳ Rendering video frames...")
        time.sleep(10)
        operation = client.operations.get(operation)

    if operation.error:
        print(f"❌ Video generation failed: {operation.error}")
        exit(1)

    result = operation.result
    if result.generated_videos:
        video = result.generated_videos[0]
        output_path = Path("public/videos/exercises/barbell-deadlift-animated.mp4")
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Download video content
        video_bytes = client.files.download(file=video.video.uri) if hasattr(video.video, 'uri') else video.video.video_bytes
        output_path.write_bytes(video_bytes)
        print(f"✅ Successfully saved animated video to: {output_path} ({len(video_bytes)} bytes)")
    else:
        print("❌ No videos generated in result.")
except Exception as e:
    print(f"⚠️ Veo 2.0 attempt error: {e}")

