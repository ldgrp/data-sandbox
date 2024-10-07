import {FileAttachment} from "observablehq:stdlib";

type Language = {
    englishName: string;
    code: string;
    text: string;
};

export const languages: Language[] = [
  { englishName: "English", code: "en", text: await FileAttachment('./data/en.txt').text() },
  { englishName: "Chinese", code: "zh", text: await FileAttachment('./data/zh.txt').text() },
  { englishName: "Spanish", code: "es", text: await FileAttachment('./data/es.txt').text() },
  { englishName: "French", code: "fr", text: await FileAttachment('./data/fr.txt').text() },
  { englishName: "Arabic", code: "ar", text: await FileAttachment('./data/ar.txt').text() },
  { englishName: "Russian", code: "ru", text: await FileAttachment('./data/ru.txt').text() },
  { englishName: "Portuguese", code: "pt", text: await FileAttachment('./data/pt.txt').text() },
  { englishName: "Tagalog", code: "tl", text: await FileAttachment('./data/tl.txt').text() },
];