import { useRef, useState } from "react";
import ReactCrop, { centerCrop, convertToPixelCrop, makeAspectCrop } from "react-image-crop";
import axios from "axios";
import imageCompression from 'browser-image-compression';

const ASPECT_RATIO = 1;
const MIN_DIMENSION = 150;

const ImageCropper = ({ closeModal, updateAvatar }) => {
  const imgRef = useRef(null);
  const previewCanvasRef = useRef(null);
  const [imgSrc, setImgSrc] = useState("");
  const [crop, setCrop] = useState();
  const [error, setError] = useState("");
  const [uploadStatus, setUploadStatus] = useState("");
  const [croppedImageBlob, setCroppedImageBlob] = useState(null);
  const [role, setRole] = useState("staff");

  const setCanvasPreview = (image, canvas, crop) => {
    const ctx = canvas.getContext("2d");
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    canvas.width = crop.width;
    canvas.height = crop.height;
    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width,
      crop.height
    );
  };

  const onSelectFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.addEventListener("load", () => {
      const imageElement = new Image();
      const imageUrl = reader.result?.toString() || "";
      imageElement.src = imageUrl;

      imageElement.addEventListener("load", (e) => {
        if (error) setError("");
        const { naturalWidth, naturalHeight } = e.currentTarget;
        if (naturalWidth < MIN_DIMENSION || naturalHeight < MIN_DIMENSION) {
          setError("Image must be at least 150 x 150 pixels.");
          return setImgSrc("");
        }
      });
      setImgSrc(imageUrl);
    });
    reader.readAsDataURL(file);
  };

  const onImageLoad = (e) => {
    const { width, height } = e.currentTarget;
    const cropWidthInPercent = (MIN_DIMENSION / width) * 100;

    const crop = makeAspectCrop(
      {
        unit: "%",
        width: cropWidthInPercent,
      },
      ASPECT_RATIO,
      width,
      height
    );
    const centeredCrop = centerCrop(crop, width, height);
    setCrop(centeredCrop);
  };

  const compressImage = async (blob) => {
    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 800,
      useWebWorker: true,
    };
    console.log('Before compression:', blob.size);
    const compressedBlob = await imageCompression(blob, options);
    console.log('After compression:', compressedBlob.size);
    return compressedBlob;
  };

  const handleCropImage = () => {
    if (!imgRef.current || !previewCanvasRef.current || !crop) return;

    setCanvasPreview(
      imgRef.current,
      previewCanvasRef.current,
      convertToPixelCrop(crop, imgRef.current.width, imgRef.current.height)
    );

    previewCanvasRef.current.toBlob(async (blob) => {
      if (blob) {
        const compressedBlob = await compressImage(blob);
        setCroppedImageBlob(compressedBlob);
      }
    });
  };

  // uploading presign url
  const handleUpload = async () => {
    if (!croppedImageBlob) return;

    try {
      const { data } = await axios.get(`http://localhost:3000/s3-presigned-url`, {
        params: {
          originalFilename: "original_image.png",
          compressedFilename: "compressed_image.png",
          mimetype: "image/png",
          role
        },
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const { originalUrl, compressedUrl , s3CompressedUrl} = data;

      if (originalUrl && compressedUrl) {
        // Upload the original image
        const originalResult = await axios.put(originalUrl, croppedImageBlob, {
          headers: { 'Content-Type': 'image/png' },
        });

        // If the original upload is successful, upload the compressed image
        if (originalResult.status === 200) {
          const compressedResult = await axios.put(compressedUrl, croppedImageBlob, {
            headers: { 'Content-Type': 'image/png' },
          });

          if (compressedResult.status === 200) {
            updateAvatar(s3CompressedUrl); 
            setUploadStatus('Upload successful!');
            closeModal();
          } else {
            setUploadStatus('Compressed image upload failed.');
          }
        } else {
          setUploadStatus('Original image upload failed.');
        }
      }
    } catch (error) {
      console.error('Error uploading files:', error);
      setUploadStatus(`Error occurred during upload: ${error.message}`);
    }
  };

  return (
    <>
      <label className="block mb-3 w-fit">
        <span className="sr-only">Choose profile photo</span>
        <input
          type="file"
          accept="image/*"
          onChange={onSelectFile}
          className="block w-full text-sm text-slate-500 file:mr-4 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs file:bg-gray-700 file:text-sky-300 hover:file:bg-gray-600"
        />
      </label>

      <label>
          <input
            type="radio"
            name="role"
            value="staff"
            checked={role === "staff"}
            onChange={() => setRole("staff")}
          />
          Staff
        </label>
        <label className="ml-4">
          <input
            type="radio"
            name="role"
            value="student"
            checked={role === "student"}
            onChange={() => setRole("student")}
          />
          Student
        </label>
   

      {error && <p className="text-red-400 text-xs">{error}</p>}
      {imgSrc && (
        <div className="flex flex-col items-center">
          <ReactCrop
            crop={crop}
            onChange={(pixelCrop, percentCrop) => setCrop(percentCrop)}
            circularCrop
            keepSelection
            aspect={ASPECT_RATIO}
            minWidth={MIN_DIMENSION}
          >
            <img
              ref={imgRef}
              src={imgSrc}
              alt="Upload"
              style={{ maxHeight: "70vh" }}
              onLoad={onImageLoad}
            />
          </ReactCrop>
          <button
            className="text-white font-mono text-xs py-2 px-4 rounded-2xl mt-4 bg-sky-500 hover:bg-sky-600"
            onClick={handleCropImage}
          >
            Crop Image
          </button>
          {croppedImageBlob && (
            <button
              className="text-white font-mono text-xs py-2 px-4 rounded-2xl mt-4 bg-green-500 hover:bg-green-600"
              onClick={handleUpload}
            >
              Upload Image
            </button>
          )}
        </div>
      )}
      {crop && (
        <canvas
          ref={previewCanvasRef}
          className="mt-4"
          style={{
            display: "none",
            border: "1px solid black",
            objectFit: "contain",
            width: 150,
            height: 150,
          }}
        />
      )}
      {uploadStatus && <p className="text-green-400 text-xs">{uploadStatus}</p>}
    </>
  );
};

export default ImageCropper;

