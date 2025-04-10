"use client";
import { useEffect, useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { HiCalendar } from "react-icons/hi";

const STATUS_COLORS = {
  pending: "bg-yellow-400",
  approved: "bg-green-500",
  "picked up": "bg-purple-500",
  returned: "bg-blue-500",
  canceled: "bg-red-500",
};

const STATUS_EMOJIS = {
  pending: "🟡",
  approved: "🟢",
  "picked up": "🟣",
  returned: "🔵",
  canceled: "🔴",
};

export default function BookingCalendar() {
  const [value, setValue] = useState(new Date());
  const [bookings, setBookings] = useState([]);
  const [selectedBookings, setSelectedBookings] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [activeStatus, setActiveStatus] = useState("all");

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/booking-dates`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            Accept: "application/json",
          },
        });
        const data = await res.json();
        if (data.success) setBookings(data.bookingDates);
      } catch (err) {
        console.error("Error fetching bookings:", err);
      }
    };
    fetchBookings();
  }, []);

  const getBookingsForDate = (date) => {
    const key = date.toLocaleDateString("en-CA");
    return bookings.filter((b) => {
      const localDate = new Date(b.date).toLocaleDateString("en-CA");
      return localDate === key;
    });
  };

  const handleDateClick = (date) => {
    const matches = getBookingsForDate(date);
    if (matches.length > 0) {
      setSelectedBookings(matches);
      setActiveStatus("all");
      setShowModal(true);
    }
  };

  const getStatuses = (date) => {
    const matches = getBookingsForDate(date);
    const uniqueStatuses = [...new Set(matches.map((b) => b.status))];
    return uniqueStatuses;
  };

  const filteredBookings = activeStatus === "all"
    ? selectedBookings
    : selectedBookings.filter((b) => b.status === activeStatus);

  return (
<div className="p-4 bg-pink-100 rounded-lg shadow-md w-[450px] h-full flex flex-col justify-start">

  <h2 className="text-2xl font-bold text-gray-700 mb-2 flex items-center justify-center gap-2">
    <HiCalendar className="text-4xl text-pink-600" />
    <span>Booking Calendar</span>
  </h2>

  <div className="flex justify-center gap-3 flex-wrap mb-4">
        {Object.entries(STATUS_COLORS).map(([label, color]) => (
          <div key={label} className="flex items-center gap-2 bg-white px-3 py-1 rounded-full shadow-sm">
            <span className={`w-3 h-3 rounded-full ${color}`}></span>
            <span className="text-pink-600 font-semibold text-sm capitalize">{label}</span>
          </div>
        ))}
      </div>

      <div className="flex-1 overflow-hidden">
      <div className="h-full overflow-auto px-2">
    <Calendar
      onChange={setValue}
      value={value}
      onClickDay={handleDateClick}
      tileContent={({ date }) => {
        const statuses = getStatuses(date);
        return statuses.length > 0 ? (
          <div className="flex justify-center gap-[2px] mt-1">
            {statuses.map((status) => (
              <span
                key={status}
                className={`w-3 h-3 rounded-full border-2 border-white ${STATUS_COLORS[status]}`}
              ></span>
            ))}
          </div>
        ) : null;
      }}
      tileClassName={({ date, view, activeStartDate }) => {
        const isDifferentMonth = date.getMonth() !== activeStartDate.getMonth();
        return view === "month" && isDifferentMonth ? "hide-day" : "";
      }}
    />
  </div>
</div>


    <style jsx global>{`
      .react-calendar__tile.hide-day {
        display: none !important;
      }

      .react-calendar__tile--active {
        background-color:rgb(237, 41, 139) !important; /* Customize selected bg color */
        border-radius: 20px;
        color: white;
      }

      .react-calendar__tile--active abbr {
        font-weight: bold;
        font-size: 1rem;
      }
    `}</style>


      {showModal && (
        <div className="fixed inset-0 flex items-start justify-center bg-black bg-opacity-50 z-50 overflow-y-auto pt-10 pb-10">
        <div className="relative bg-white p-4 rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-2 right-2 text-gray-500 hover:text-red-500 text-xl"
            >
              ✕
            </button>
            <h3 className="text-lg font-bold mb-4 text-gray-800 dark:text-white">
            📦 Bookings on {value.toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            }).replace(/ /g, "-")}
          </h3>
            <div className="mt-4 px-6 pb-6 overflow-y-auto" style={{ maxHeight: "70vh" }}>
            <div className="flex gap-2 mb-4 flex-wrap">
            <button
              onClick={() => setActiveStatus("all")}
              className={`px-4 py-1.5 rounded-full font-medium text-sm transition-all flex items-center gap-2 ${
                activeStatus === "all"
                  ? "bg-pink-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              All
            </button>
            {[...new Set(selectedBookings.map((b) => b.status))].map((status) => {
              const baseColor = STATUS_COLORS[status];
              const isActive = activeStatus === status;

              return (
                <button
                  key={status}
                  onClick={() => setActiveStatus(status)}
                  className={`px-4 py-1.5 rounded-full font-medium text-sm capitalize flex items-center gap-2 transition-all ${
                    isActive
                      ? `${baseColor} text-white`
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                <span className={`w-3 h-3 rounded-full border-2 border-white ${baseColor}`}></span>
                  <span>{status}</span>
                </button>
              );
            })}
          </div>

          {filteredBookings.map((booking) => (
      <div key={booking.id} className="mb-2 border-b border-gray-200 dark:border-gray-700 pb-2">
       <p className="text-sm text-gray-700 dark:text-gray-300">
        <span className="font-semibold">Booking Reference:</span> {booking.reference_number}
      </p>

      <p className="text-sm text-gray-700 dark:text-gray-300">
        <span className="font-semibold">Product Name:</span> {booking.product?.name ?? 'Unknown'}
      </p>

      <p className="text-sm text-gray-700 dark:text-gray-300">
        <span className="font-semibold">Size:</span> {booking.sizes ?? 'N/A'}
      </p>

      <p className="text-sm text-gray-700 dark:text-gray-300">
      <span className="font-semibold">Total Price:</span> ₱{Number(booking.total_price).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
      </p>

        <span
          className={`inline-block px-3 py-1 text-xs font-semibold text-white rounded-full capitalize ${STATUS_COLORS[booking.status]}`}
        >
          {booking.status}
        </span>


        <p className="text-xs text-gray-600 italic mt-1">
          {booking.status === "pending" && `Waiting for admin approval. Scheduled to start on ${new Date(booking.start_date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric",
            }).replace(/ /g, "-")}`}
          {booking.status === "approved" && `Approved and ready for pickup on ${new Date(booking.start_date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric",
            }).replace(/ /g, "-")}.`}
          {booking.status === "picked up" && `Item picked up. Expected return by ${new Date(booking.end_date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric",
            }).replace(/ /g, "-")}.`}
          {booking.status === "returned" && `Item has been returned successfully.`}
          {booking.status === "canceled" && (
          booking.canceled_by === "customer"
            ? "Booking was canceled by the customer."
            : "Booking was canceled by the admin."
        )}


        </p>


        <div className="flex items-center gap-6 mt-2 text-sm text-gray-700 dark:text-gray-300">
          <div className="flex items-center gap-2">
            <HiCalendar className="text-lg text-pink-700" />
            <div className="flex flex-col leading-tight">
              <span className="text-xs text-gray-500">Start date</span>
              <span className="font-semibold text-pink-800">
              {new Date(booking.start_date).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              }).replace(/ /g, "-")}

              </span>
            </div>
          </div>

      <div className="flex items-center gap-2">
          <HiCalendar className="text-lg text-pink-400" />
          <div className="flex flex-col leading-tight">
            <span className="text-xs text-gray-500">End date</span>
            <span className="font-semibold text-pink-600">
            {new Date(booking.end_date).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            }).replace(/ /g, "-")}

            </span>
          </div>
        </div>
      </div>
    </div>
  ))}

          </div>
        </div>
        </div>
      )}
    </div>
  );
}
