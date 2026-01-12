import { EventResponse } from "../services/events/eventService";

/**
 * Formata uma data individual
 */
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
  });
};

/**
 * Formata múltiplas datas do evento usando event_dates ou starts_at/ends_at
 */
export const formatEventDates = (event: EventResponse): string => {
  // Se houver o campo event_dates, usa ele
  if (event.event_dates) {
    // Verifica se é uma string de datas ISO separadas por vírgula
    const datesMatch = event.event_dates.match(/\d{4}-\d{2}-\d{2}/g);
    if (datesMatch && datesMatch.length > 0) {
      // Formata as datas
      const formattedDates = datesMatch.map((dateStr) => {
        const date = new Date(dateStr);
        return {
          day: date.getDate(),
          month: date.toLocaleDateString("pt-BR", { month: "long" }),
          year: date.getFullYear(),
        };
      });

      // Agrupa por mês/ano
      const groupedByMonth = formattedDates.reduce((acc, date) => {
        const key = `${date.month}-${date.year}`;
        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(date.day);
        return acc;
      }, {} as Record<string, number[]>);

      // Formata cada grupo
      const formattedGroups = Object.entries(groupedByMonth).map(([key, days]) => {
        const [month, year] = key.split("-");
        const sortedDays = days.sort((a, b) => a - b);
        
        // Formata os dias: "09, 10, 20 e 21"
        let daysStr = "";
        if (sortedDays.length === 1) {
          daysStr = sortedDays[0].toString();
        } else if (sortedDays.length === 2) {
          daysStr = `${sortedDays[0]} e ${sortedDays[1]}`;
        } else {
          const lastDay = sortedDays[sortedDays.length - 1];
          const otherDays = sortedDays.slice(0, -1);
          daysStr = `${otherDays.join(", ")} e ${lastDay}`;
        }

        const currentYear = new Date().getFullYear();
        return `${daysStr} de ${month}${parseInt(year) !== currentYear ? ` de ${year}` : ""}`;
      });

      return formattedGroups.join(", ");
    } else {
      // Se não for formato ISO, retorna como está (pode ser uma string já formatada)
      return event.event_dates;
    }
  }

  // Caso contrário, usa starts_at e ends_at
  const startDate = new Date(event.starts_at);
  const endDate = new Date(event.ends_at);
  
  // Se for o mesmo dia
  if (startDate.toDateString() === endDate.toDateString()) {
    return formatDate(event.starts_at);
  }

  // Se for no mesmo mês
  if (
    startDate.getMonth() === endDate.getMonth() &&
    startDate.getFullYear() === endDate.getFullYear()
  ) {
    const month = startDate.toLocaleDateString("pt-BR", { month: "long" });
    const startDay = startDate.getDate();
    const endDay = endDate.getDate();
    return `${startDay} a ${endDay} de ${month}`;
  }

  // Datas em meses/anos diferentes
  return `${formatDate(event.starts_at)} a ${formatDate(event.ends_at)}`;
};

