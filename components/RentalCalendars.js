"use client";

import { useState } from "react";
import { DateRange } from "react-date-range";
import { format, eachMonthOfInterval, isBefore, isAfter, startOfMonth, max } from "date-fns";
import { toast } from "react-hot-toast";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";

export default function RentalCalendars({ product, rentalDetails, setRentalDetails }) {
  const today = new Date();
  const productStartDate = new Date(product?.start_date);
  const minDate = max([today, productStartDate]);
  const maxDate = new Date(product?.end_date);

  const [range, setRange] = useState([
    {
      startDate: rentalDetails.startDate ? new Date(rentalDetails.startDate) : null,
      endDate: rentalDetails.endDate ? new Date(rentalDetails.endDate) : null,
      key: "selection",
    },
  ]);

  const [focusedMonth, setFocusedMonth] = useState(startOfMonth(minDate));

  const handleSelect = (ranges) => {
    const startDate = ranges.selection.startDate;
    const endDate = ranges.selection.endDate;

    if (!startDate || !endDate) return;

    if (
      range[0].startDate?.toDateString() === startDate.toDateString() &&
      range[0].endDate?.toDateString() === endDate.toDateString()
    )
      return;

    // First click
    if (
      startDate &&
      endDate &&
      startDate.toDateString() === endDate.toDateString()
    ) {
      setRange([
        {
          startDate,
          endDate: startDate,
          key: "selection",
        },
      ]);
      setRentalDetails({ startDate, endDate: null });
      return;
    }

    if (isBefore(endDate, startDate)) {
      toast.error("End date must be after start date.");
      return;
    }

    setRange([ranges.selection]);
    setRentalDetails({ startDate, endDate });
  };

  const handleShownDateChange = (date) => {
    const next = startOfMonth(date);
  
    if (isBefore(next, minDate)) {
      setFocusedMonth(startOfMonth(minDate));
    } else if (isAfter(next, maxDate)) {
      setFocusedMonth(startOfMonth(maxDate));
    } else {
      setFocusedMonth(next);
    }
  };
  
  

  return (
    <div className="bg-white shadow-md rounded-lg p-6 w-full max-w-2xl mx-auto">
   <div className="mb-4 px-3 sm:px-0 text-center w-full flex justify-center">
  <p className="selected-range-label text-sm sm:text-base font-semibold text-gray-700 leading-tight break-words max-w-full sm:max-w-none">
    Selected Range:
    {range[0].startDate && !range[0].endDate ? (
      <span className="text-pink-700 font-bold ml-1">
        {format(range[0].startDate, "EEE, dd-MMM-yyyy")} (Start Date)
      </span>
    ) : range[0].startDate && range[0].endDate ? (
      range[0].startDate.toDateString() === range[0].endDate.toDateString() ? (
        <span className="text-pink-700 font-bold ml-1">
          {format(range[0].startDate, "EEE, dd-MMM-yyyy")}
        </span>
      ) : (
        <span className="text-pink-700 font-bold ml-1">
          {format(range[0].startDate, "EEE, dd-MMM-yyyy")} to{" "}
          {format(range[0].endDate, "EEE, dd-MMM-yyyy")}
        </span>
      )
    ) : (
      <span className="text-gray-400 font-semibold ml-2">None selected</span>
    )}
  </p>
</div>

      <div className="w-full max-w-[440px] mx-auto px-2 sm:px-0">
      <DateRange
        className="w-full"
        editableDateInputs={true}
        onChange={handleSelect}
        moveRangeOnFirstSelection={false}
        ranges={range}
        minDate={minDate}
        maxDate={maxDate}
        initialFocusedDate={focusedMonth}
        onShownDateChange={handleShownDateChange}
      />
    </div>

    </div>
  );
}
