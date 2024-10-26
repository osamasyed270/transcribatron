import { DEBUG_MODE } from "@/utils/Constant";
import http from "@/utils/Http";

const MEDIA_API = "";

const getAllMedias = () => {
    return http
        .get(MEDIA_API + "preview/allfiles")
        .then(
            (res) => {
                return res;
            },
            (err) => {
//                if (!DEBUG_MODE) console.clear();
                return err.response;
            }
        )
        .catch((err) => {
            return err;
        });
}

const getTranscriptionByFileId = (fileId) => {
    return http
        .get(MEDIA_API + "preview?fileName=" + fileId)
        .then(
            (res) => {
                return res;
            },
            (err) => {
//                if (!DEBUG_MODE) console.clear();
                return err.response;
            }
        )
        .catch((err) => {
            return err;
        });
}

const updateTranscriptionByFileId = (fileId, transcription) => {
    return http
        .post(MEDIA_API + "transcripts/update", { fileId, transcription })
        .then(
            (res) => {
                return res;
            },
            (err) => {
//                if (!DEBUG_MODE) console.clear();
                return err.response;
            }
        )
        .catch((err) => {
            return err;
        });
}

const MediaService = {
    getAllMedias,
    getTranscriptionByFileId,
    updateTranscriptionByFileId
};

export default MediaService;