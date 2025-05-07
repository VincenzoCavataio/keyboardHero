export const $ = (sel) => document.querySelector(sel);

export const canvas = $("#gameCanvas");
export const ctx = canvas.getContext("2d");

export const pickerLabel = $(".picker-label"); // wrapper del pulsante "Upload song"
export const audio = $("#audioPlayer");
export const keyElems = document.querySelectorAll(".keyLabel");

export const scoreEl = $("#scoreDisplay");
export const highEl = $("#highDisplay");
export const lifeValEl = $("#lifeValue");
export const lifeFill = $("#lifeFill");
export const comboEl = $("#comboDisplay");
export const multEl = $("#multiplierDisplay");
export const hitInfo = $("#hitInfo");
export const bonusFill = $("#bonusFill");
export const modal = $("#resultModal");
export const mScore = $("#modalScore");
export const mAcc = $("#modalAcc");
export const mBreak = $("#modalBreak");
export const newBtn = $("#newSongBtn");
