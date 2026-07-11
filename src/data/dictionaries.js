// Справочники ЕППБ — чистый ESM, без JSX. Импортируется клиентом и сервером.

export const dictionaries = {
  regions: [
    { value: "akmola", label: "Акмолинская область" },
    { value: "aktobe", label: "Актюбинская область" },
    { value: "almaty-region", label: "Алматинская область" },
    { value: "atyrau", label: "Атырауская область" },
    { value: "vko", label: "Восточно-Казахстанская область" },
    { value: "zhambyl", label: "Жамбылская область" },
    { value: "zko", label: "Западно-Казахстанская область" },
    { value: "karaganda", label: "Карагандинская область" },
    { value: "kostanay", label: "Костанайская область" },
    { value: "kyzylorda", label: "Кызылординская область" },
    { value: "mangystau", label: "Мангистауская область" },
    { value: "pavlodar", label: "Павлодарская область" },
    { value: "sko", label: "Северо-Казахстанская область" },
    { value: "turkestan", label: "Туркестанская область" },
    { value: "ulytau", label: "Улытауская область" },
    { value: "abay", label: "область Абай" },
    { value: "zhetisu", label: "область Жетісу" },
    { value: "astana", label: "г. Астана" },
    { value: "almaty", label: "г. Алматы" },
    { value: "shymkent", label: "г. Шымкент" },
  ],

  sectors: [
    { value: "agro", label: "АПК" },
    { value: "industry", label: "Промышленность" },
    { value: "transport", label: "Транспорт и логистика" },
    { value: "energy", label: "Энергетика" },
    { value: "construction", label: "Строительство" },
    { value: "trade", label: "Торговля" },
    { value: "services", label: "Услуги" },
    { value: "it", label: "IT" },
    { value: "tourism", label: "Туризм" },
    { value: "export", label: "Экспорт" },
  ],

  legalForms: [
    { value: "too", label: "ТОО" },
    { value: "ao", label: "АО" },
    { value: "ip", label: "ИП" },
    { value: "kh", label: "КХ/ФХ" },
    { value: "pk", label: "ПК" },
  ],

  wagonTypes: [
    { value: "gondola", label: "Полувагоны" },
    { value: "covered", label: "Крытые вагоны" },
    { value: "grain", label: "Зерновозы" },
    { value: "tank", label: "Цистерны" },
    { value: "fitting", label: "Фитинговые платформы" },
    { value: "hopper", label: "Хопперы" },
  ],

  livestockTypes: [
    { value: "cattle-dairy", label: "КРС молочного направления" },
    { value: "cattle-beef", label: "КРС мясного направления" },
    { value: "small-cattle", label: "МРС (овцы, козы)" },
    { value: "horses", label: "Лошади" },
    { value: "camels", label: "Верблюды" },
  ],

  purposes: [
    { value: "livestock-purchase", label: "Приобретение поголовья" },
    { value: "construction", label: "Строительство объектов" },
    { value: "equipment", label: "Приобретение оборудования" },
    { value: "working-capital", label: "Пополнение оборотных средств" },
  ],

  categories: [
    { id: "finance", label: "Кредитование" },
    { id: "leasing", label: "Лизинг" },
    { id: "guarantee", label: "Гарантирование" },
    { id: "subsidy", label: "Субсидирование" },
    { id: "export", label: "Экспорт" },
    { id: "insurance", label: "Страхование" },
    { id: "invest", label: "Инвестиции" },
    { id: "agro", label: "АПК" },
    { id: "transport", label: "Транспорт" },
  ],
};
