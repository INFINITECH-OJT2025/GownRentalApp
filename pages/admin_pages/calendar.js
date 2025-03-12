// "use client";

// import { useState, useEffect } from "react";
// import Calendar from "react-calendar";
// import "react-calendar/dist/Calendar.css";
// import axios from "axios";

// export default function ScheduleCalendar() {
//     const [date, setDate] = useState(null); // Start as null to avoid SSR error
//     const [bookings, setBookings] = useState([]);
//     const [selectedBooking, setSelectedBooking] = useState(null);
//     const [isMounted, setIsMounted] = useState(false); // Ensure we run after mounting on the client

//     // Fetch booking data once component mounts
//     useEffect(() => {
//         setIsMounted(true); // Mark component as mounted to indicate we're on the client side
//         setDate(new Date()); // Set the current date after mounting
//         fetchBookingDates(); // Fetch booking dates once mounted
//     }, []);

//     // Fetch the booking dates from your API
//     const fetchBookingDates = async () => {
//         try {
//             const token = localStorage.getItem("authToken");
//             if (!token) {
//                 console.error("No authentication token found.");
//                 return;
//             }

//             const response = await axios.get("http://127.0.0.1:8000/api/booking-dates", {
//                 headers: {
//                     "Authorization": `Bearer ${token}`,
//                     "Accept": "application/json",
//                 },
//             });

//             if (response.data.success) {
//                 setBookings(response.data.bookingDates); // Set the fetched booking dates
//             } else {
//                 console.error("Failed to fetch booking dates:", response.data.message);
//             }
//         } catch (error) {
//             console.error("Error fetching bookings:", error.response?.data || error.message);
//         }
//     };

//     // Handle date selection on the calendar
//     const handleDateClick = (clickedDate) => {
//         if (!isMounted) return; // Only allow changes once mounted

//         setDate(clickedDate);
//         const formattedDate = clickedDate.toISOString().split("T")[0]; // Format date to YYYY-MM-DD

//         // Filter bookings that match the selected date
//         const validStatuses = ["pending", "approved", "picked up", "returned"];
//         const filteredBookings = bookings.filter(booking =>
//             booking.start_date === formattedDate && validStatuses.includes(booking.status)
//         );

//         setSelectedBooking(filteredBookings.length > 0 ? filteredBookings[0] : null);
//     };

//     // Highlight dates that have bookings (green background)
//     const tileClassName = ({ date }) => {
//         if (!isMounted) return ""; // Don't render until mounted

//         const formattedDate = date.toISOString().split("T")[0]; // Format date to YYYY-MM-DD
//         const validStatuses = ["pending", "approved", "picked up", "returned"];

//         // Check if the date matches any of the bookings' start dates and statuses
//         return bookings.some(booking =>
//             booking.start_date === formattedDate && validStatuses.includes(booking.status)
//         )
//             ? "bg-green-500 text-white rounded-full"  // Highlight booked dates in green
//             : "";
//     };

//     // Prevent rendering before the component is mounted
//     if (!isMounted || date === null) {
//         return <div className="p-6 text-gray-600">Loading Calendar...</div>;
//     }

//     return (
//         <div className="p-6 bg-white dark:bg-[#1E293B] rounded-lg shadow-md">
//             <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center">
//                 📅 Schedule Calendar
//             </h1>
//             <p className="text-gray-500 dark:text-gray-300">Select a date to view or add schedules.</p>

//             {/* FLEX CONTAINER FOR ALIGNMENT */}
//             <div className="mt-4 flex items-start space-x-6">
//                 {/* Calendar */}
//                 <div className="border rounded-lg p-4 shadow-lg">
//                     <Calendar
//                         onChange={handleDateClick}
//                         value={date}
//                         tileClassName={tileClassName}
//                     />
//                 </div>

//                 {/* Selected Date Info - LEFT ALIGNED */}
//                 <div className="p-4 bg-white dark:bg-gray-800 shadow-md rounded-md w-64">
//                     <h2 className="text-lg font-semibold text-gray-700 dark:text-white">
//                         Selected Date:
//                     </h2>
//                     <p className="text-lg font-bold text-[#7D1874]">{date.toDateString()}</p>

//                     {/* Display booking details if selected */}
//                     {selectedBooking ? (
//                         <div className="mt-3 p-3 bg-gray-100 dark:bg-gray-700 rounded-md">
//                             <p className="text-sm text-gray-800 dark:text-white">
//                                 <span className="font-semibold">Booking Ref:</span> {selectedBooking.reference_number}
//                             </p>
//                             <p className="text-sm text-gray-800 dark:text-white">
//                                 <span className="font-semibold">End Date:</span> {selectedBooking.end_date}
//                             </p>
//                             <p className="text-sm text-gray-800 dark:text-white">
//                                 This booking ends on {new Date(selectedBooking.end_date).toDateString()}.
//                             </p>
//                         </div>
//                     ) : (
//                         <p className="text-gray-500 dark:text-gray-300">
//                             No bookings found for this date.
//                         </p>
//                     )}
//                 </div>
//             </div>
//         </div>
//     );
// }
