export const STATUS_LABEL: Record<string, string> = {
  new: "Новый",
  in_progress: "В работе",
  qualification: "Квалификация",
  negotiation: "Переговоры",
  rejected: "Отказ",
  client: "Клиент",
};

export const SEGMENT_LABEL: Record<string, string> = {
  opt: "Опт",
  konditerka: "Кондитерка",
  morozhenoe: "Мороженое",
  pekarnya: "Пекарня",
  polufabrikat: "Полуфабрикаты",
  fasovshik: "Фасовщик / СТМ",
  horeca_opt: "HoReCa-опт",
};

export const SEGMENTS = Object.keys(SEGMENT_LABEL);
export const STATUSES = Object.keys(STATUS_LABEL);
export const PRIORITIES = ["A", "B", "C"];
