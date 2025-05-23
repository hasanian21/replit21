import { useEffect, useState } from "react";
import ImageUploading, { ImageListType } from "react-images-uploading";
import Image from "next/image";
import { Icon } from "@iconify/react";
import ReactS3Client from "react-s3-typescript";

//S3 Config
import { s3Config } from "@/Helpers/s3.config";

//Interface
interface Props {
    label: string;
    width: number;
    height: number;
    onChange: (e: string) => void;
    is_multiple: boolean;
    size?: number;
    folderName?: string;
    value?: string | null;
    className?: string;
    error?: boolean;
}

const ImageUploader = ({ label, is_multiple, width, height, size, folderName, value, onChange, className, error = false }: Props) => {
    //State
    const [image, setImage] = useState<ImageListType>([]);
    const [progress, setProgress] = useState<number>(0);

    //OnImageChange
    const onImageChange = async (imageList: ImageListType) => {
        await setImage(imageList);
        if (imageList.length > 0) {
            await setProgress(0);
            try {
                const s3 = new ReactS3Client({ ...s3Config, dirName: folderName || "Nekmart" });
                const res = await s3.uploadFile(imageList[0].file as File);
                onChange(res.key)
                if (value) {
                    await s3.deleteFile(value);
                }
            } finally {
                setProgress(100)
            }
        }
    }

    useEffect(() => {
        if (!value) {
            setImage([])
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value])

    return (
        <div className={`grid grid-cols-4 gap-2 items-start ${className}`}>
            <div className="col-span-1 w-max">
                <label htmlFor="description">{label}</label>
                <p className="text-xs mt-px opacity-75">{width}x{height}</p>
            </div>
            <div className="col-span-3">
                <ImageUploading
                    value={image}
                    onChange={onImageChange}
                    multiple={is_multiple}
                    maxNumber={size || 1}
                    maxFileSize={5000000}
                    resolutionWidth={width}
                    resolutionHeight={height}
                    resolutionType="ratio"
                    dataURLKey="nek-url"
                >
                    {({
                        imageList,
                        onImageUpload,
                        onImageRemove,
                        isDragging,
                        dragProps,
                        errors
                    }) => (
                        <div>
                            <button
                                onClick={onImageUpload}
                                {...dragProps}
                                className={`border border-solid w-full rounded-md flex gap-4 items-center justify-start overflow-hidden ${error ? "border-red-500" : "border-gray-200"}`}
                                type="button"
                            >
                                <p className={` px-3 py-2 opacity-80 ${error ? "bg-red-50 text-red-500" : "bg-white_hover"}`}>Browser</p>
                                {isDragging &&
                                    <p className={"text-sm " + isDragging ? "bg-main" : ""}>
                                        Drop Here
                                    </p>
                                }
                                {!isDragging &&
                                    <p className={`text-sm ${error && "text-red-500"}`}>
                                        {imageList.length > 0 ? `${imageList.length} File selected` : "Choose File"}
                                    </p>
                                }
                            </button>
                            <div className="flex gap-2 mt-2">
                                {imageList.map((image, i) => (
                                    <div key={i} className="border border-solid border-gray-200 rounded relative w-[150px]">
                                        <button onClick={() => onImageRemove(i)} className="absolute -top-2 -right-2 w-[25px] h-[25px] bg-white_hover text-main rounded-full flex justify-center items-center" type="button">
                                            <Icon icon="clarity:window-close-line" />
                                        </button>
                                        <Image src={image["nek-url"]} alt="Image" width={width} height={height} className="w-[150px] h-[60px] object-cover object-top rounded-t" />
                                        <div className="py-2 px-3">
                                            <p className="flex text-sm">
                                                <span className="truncate">
                                                    {image?.file?.name.split(".")[0]}
                                                </span>
                                                <span>
                                                    .{image?.file?.name.split(".")[1]}
                                                </span>
                                            </p>
                                            <p className="text-xs opacity-70">
                                                {(image?.file?.size as number / (1024 * 1024)).toFixed(2)}MB
                                            </p>
                                        </div>
                                        <div>
                                            <div className="w-full relative h-[2px] bg-main bg-opacity-40">
                                                <div className="absolute bg-green-600 left-0 top-0 bottom-0 w-0 transition-[width] ease-out duration-700" style={{ width: `${progress}%` }} />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {value && imageList.length === 0 &&
                                    <div className="border border-solid border-gray-200 rounded relative w-[100px]" key={value}>
                                        <Image src={process.env.NEXT_PUBLIC_IMAGE_URL + value} alt="Image" width={width} height={height} className="w-[100px] object-cover object-top rounded" key={value} priority />
                                    </div>
                                }
                            </div>
                            {errors &&
                                <ul className="mt-3">
                                    {errors.maxFileSize &&
                                        <li className="flex text-sm text-main font-medium items-center gap-1"><div className="w-[4px] h-[4px] rounded-full bg-main" /> <p>File size exceeds 5MB limit.</p></li>
                                    }
                                    {errors.maxNumber &&
                                        <li className="flex text-sm text-main font-medium items-center gap-1"><div className="w-[4px] h-[4px] rounded-full bg-main" /> <p>Select one image at a time.</p></li>
                                    }
                                    {errors.acceptType &&
                                        <li className="flex text-sm text-main font-medium items-center gap-1"><div className="w-[4px] h-[4px] rounded-full bg-main" /> <p>Only image files are allowed.</p></li>
                                    }
                                    {errors.resolution &&
                                        <li className="flex text-sm text-main font-medium items-center gap-1"><div className="w-[4px] h-[4px] rounded-full bg-main" /> <p>Image must be {width}x{height} pixels.</p></li>
                                    }
                                </ul>
                            }
                        </div>
                    )}
                </ImageUploading>
            </div>
        </div>
    );
};

export default ImageUploader;