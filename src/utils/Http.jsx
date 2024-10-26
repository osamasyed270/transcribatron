import axios from "axios";

import { BASE_API } from "./Constant";

export default axios.create({
  baseURL: BASE_API,
  maxBodyLength: Infinity,
  headers: {
    "Content-Type": "application/json"
  },
});
