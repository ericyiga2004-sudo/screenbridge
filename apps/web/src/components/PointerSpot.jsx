import { useEffect, useState } from 'react';
import { containedRect } from '../lib/videoGeometry';

// Overlay-only collaborative pointer. No remote control and no recording.
export default function PointerSpot({ pointer, stageRef, videoRef }) {
  const [spot, setSpot] = useState(null);
  useEffect(() => {
    const stage = stageRef.current;
    const video = videoRef.current;
    if (!pointer || !stage || !video) { setSpot(null); return; }
    const measure = () => {
      const box = containedRect(stage.clientWidth, stage.clientHeight, video.videoWidth, video.videoHeight);
      if (box) setSpot({ left: box.left + pointer.x * box.width, top: box.top + pointer.y * box.height });
      else setSpot(null);
    };
    measure();
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    observer?.observe(stage);
    video.addEventListener('loadedmetadata', measure);
    window.addEventListener('resize', measure);
    return () => { observer?.disconnect(); video.removeEventListener('loadedmetadata', measure); window.removeEventListener('resize', measure); };
  }, [pointer, stageRef, videoRef]);
  if (!spot) return null;
  return <div className="laser-pointer" style={spot} aria-hidden="true"><span /></div>;
}
