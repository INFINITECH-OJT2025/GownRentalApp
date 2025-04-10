import Image from "next/image";

const Header = ({ isSidebarOpen }) => {
  if (isSidebarOpen) {
    // Just show logo/title inside sidebar space
    return (
      <div className="fixed top-0 left-0 flex items-center px-4 py-3 bg-white w-60">
     
      </div>
    );
  }

  return (
    <header className="fixed top-0 w-full z-10 bg-white shadow-md px-4 py-3 flex items-center justify-between min-h-[64px]">
      <div className="flex items-center md:ml-0 ml-12">
        <Image
          src="/gownrentalsicon.svg"
          alt="GownRental Logo"
          width={40}
          height={40}
          className="mr-2"
        />
        <h1 className="text-pink-600 font-bold text-lg">Gown Rental</h1>
      </div>
    </header>
  );
};

export default Header;
