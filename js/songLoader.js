import { Note, NOTE_TYPES } from "./note.js";

export async function loadSongFromFile(file) {
  const text = await file.text();
  const data = JSON.parse(text);
  return data.map(
    (n) =>
      new Note({
        time: n.time,
        lane: n.lane,
        type: NOTE_TYPES[n.type?.toUpperCase()] || NOTE_TYPES.NORMAL,
        duration: n.duration || 0,
      })
  );
}
