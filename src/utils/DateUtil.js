
export class DateUtil {
  static format(date, format = "dd/MM/yyyy") {
    if (!date) return "";

    const d = new Date(date);

    const replacers = {
      dd: d.getDate().toString().padStart(2, "0"),
      MM: (d.getMonth() + 1).toString().padStart(2, "0"),
      yyyy: d.getFullYear(),
    };

    return Object.entries(replacers).reduce(
      (acc, [token, value]) => acc.replace(token, value),
      format
    );
  }
  
}
