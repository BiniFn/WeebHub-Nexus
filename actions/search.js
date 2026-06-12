"use server";
import Anilist from "@consumet/extensions/dist/providers/meta/anilist.js";

const anilist_consumet = new Anilist();

export async function searchAnime(query) {
  try {
    const data = await anilist_consumet.search(query);
    // Return a plain object to the client
    return JSON.parse(JSON.stringify(data));
  } catch (error) {
    console.error("Search error:", error);
    throw new Error(error.message);
  }
}
