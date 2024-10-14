import { useRef, useState } from "react";
import PencilIcon from "./PencilIcon";
import Modal from "./Modal";
import Zoom from "react-medium-image-zoom";
import 'react-medium-image-zoom/dist/styles.css';

const Profile = () => {
  const [avatarUrl, setAvatarUrl] = useState("https://avatarfiles.alphacoders.com/161/161002.jpg");
  const [modalOpen, setModalOpen] = useState(false);

  const updateAvatar = (imgSrc) => {
  //   const questionMarkIndex = imgSrc.indexOf('?');
  
  // if (questionMarkIndex !== -1) {
  //   setAvatarUrl(imgSrc.substring(0, questionMarkIndex));
  // }
    setAvatarUrl(imgSrc)
  };

  
  return (
    <div className="flex flex-col items-center pt-12">
      <div className="relative">
        <Zoom>
          <img
            src={avatarUrl}
            alt="Avatar"
            className="w-[150px] h-[150px] rounded-full border-2 border-gray-400 cursor-pointer"
          />
        </Zoom>
        <button
          className="absolute -bottom-3 left-0 right-0 m-auto w-fit p-[.35rem] rounded-full bg-gray-800 hover:bg-gray-700 border border-gray-600"
          title="Change photo"
          onClick={() => setModalOpen(true)}
        >
          <PencilIcon />
        </button>
      </div>
      <h2 className="text-white font-bold mt-6">Mohammed Salih</h2>
      <p className="text-gray-500 text-xs mt-2">Software Engineer</p>

      {modalOpen && (
        <Modal
          updateAvatar={updateAvatar}
          closeModal={() => setModalOpen(false)}
        />
      )}
    </div>
  );
};

export default Profile;
