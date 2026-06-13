"use server"
import { compareTwoStrings } from 'string-similarity';

export async function getMappings(title) {
  // basic checks
  if (!title) return null;
  if (!title?.english && !title?.romaji) return null;

  const baseUrl = process.env.NEXT_PUBLIC_CONSUMET_URL || "https://consumet-api-ivory.vercel.app";

  const fetchSearch = async (query) => {
    try {
      const res = await fetch(`${baseUrl}/anime/gogoanime/${encodeURIComponent(query)}`);
      return res.ok ? await res.json() : { results: [] };
    } catch {
      return { results: [] };
    }
  };

  //** */ main logic
  let eng = title?.english ? await fetchSearch(title?.english) : { results: [] };
  let rom = title?.romaji ? await fetchSearch(title?.romaji) : { results: [] };
  
  // console.log(eng, rom)
  let english_search = eng?.results || [];
  let romaji_search = rom?.results || [];
  // Combine both results and remove duplicates
  const combined = [...english_search, ...romaji_search];

  const uniqueResults = Array.from(new Set(combined.map(item => JSON.stringify(item))))
    .map(item => JSON.parse(item));

  let highestComp = 0;
  let similarity_id = "";

  uniqueResults?.forEach((obj, i) => {
    const id = obj.id;
    const ob_title = obj.title;
    const ob_japaneseTitle = obj.japaneseTitle;

    const eng_comparision = compareTwoStrings(title?.english, ob_title)
    const jp_comparision = compareTwoStrings(title?.romaji, ob_japaneseTitle)

    const greatest_title = Math.max(eng_comparision, jp_comparision)

    if (highestComp < greatest_title) {
      highestComp = greatest_title
      similarity_id = id
    }
  });

  return similarity_id;
}
