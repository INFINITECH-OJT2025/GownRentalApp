import Calendar from "react-calendar";
import { toast } from "react-hot-toast";
import { format } from "date-fns";

export default function RentalCalendars({
  product,
  rentalDetails,
  setRentalDetails,
}) {
  const handleDateChange = (type, value) => {
    const formatted = format(new Date(value), "dd-MMM-yyyy");

    if (type === "startDate") {
      toast.success(`Start Date Selected: ${formatted}`, { position: "top-right" });
      setRentalDetails((prev) => ({
        ...prev,
        startDate: value,
        endDate: prev.endDate && new Date(prev.endDate) < new Date(value) ? null : prev.endDate,
      }));
    }

    if (type === "endDate") {
      if (!rentalDetails.startDate) {
        toast.error("Please select a Start Date first!", { position: "top-right" });
        return;
      }

      const start = new Date(rentalDetails.startDate);
      const selectedEnd = new Date(value);

      if (selectedEnd <= start) {
        toast.error("End Date must be after the Start Date.", {
          position: "top-right",
        });
        return;
      }

      toast.success(`End Date Selected: ${formatted}`, { position: "top-right" });
      setRentalDetails((prev) => ({ ...prev, endDate: value }));
    }
  };

  const isDateAvailable = (date, isStartDate = true) => {
    if (!product?.start_date || !product?.end_date) return false;

    const start = new Date(product.start_date);
    const end = new Date(product.end_date);

    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const startOnly = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const endOnly = new Date(end.getFullYear(), end.getMonth(), end.getDate());

    if (isStartDate) {
      return dateOnly >= startOnly && dateOnly < endOnly;
    } else {
      if (!rentalDetails.startDate) {
        return dateOnly >= startOnly && dateOnly <= endOnly;
      }

      const selectedStart = new Date(rentalDetails.startDate);
      selectedStart.setHours(0, 0, 0, 0);
      return dateOnly > selectedStart && dateOnly <= endOnly;
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 justify-center">
      {/* Start Date */}
      <div className="flex flex-col items-center w-full max-w-[280px]">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Start Date (Pick-Up)
        </label>
        <Calendar
          value={rentalDetails.startDate ? new Date(rentalDetails.startDate) : null}
          onChange={(date) => handleDateChange("startDate", date)}
          tileDisabled={({ date }) => !isDateAvailable(date, true)}
          tileClassName={({ date }) =>
            isDateAvailable(date, true)
              ? rentalDetails.startDate &&
                new Date(rentalDetails.startDate).toDateString() === date.toDateString()
                ? "react-calendar__tile--active"
                : "available-date"
              : "react-calendar__tile--disabled"
          }
          className="w-full rounded-lg shadow-sm border border-gray-300 p-2"
          minDate={new Date(product.start_date)}
          maxDate={new Date(product.end_date)}
          prevLabel="‹"
          nextLabel="›"
          showNeighboringMonth={false}
          defaultView="month"
          maxDetail="month"
        />
      </div>

      {/* End Date */}
      <div className="flex flex-col items-center w-full max-w-[280px]">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          End Date (Return Due)
        </label>
        <Calendar
          value={rentalDetails.endDate ? new Date(rentalDetails.endDate) : null}
          onChange={(date) => handleDateChange("endDate", date)}
          tileDisabled={({ date }) => !isDateAvailable(date, false)}
          tileClassName={({ date }) =>
            isDateAvailable(date, false)
              ? rentalDetails.endDate &&
                new Date(rentalDetails.endDate).toDateString() === date.toDateString()
                ? "react-calendar__tile--active"
                : "available-date"
              : "react-calendar__tile--disabled"
          }
          className="w-full rounded-lg shadow-sm border border-gray-300 p-2"
          minDate={new Date(product.start_date)}
          maxDate={new Date(product.end_date)}
          prevLabel="‹"
          nextLabel="›"
          showNeighboringMonth={false}
          defaultView="month"
          maxDetail="month"
        />
      </div>
    </div>
  );
}
