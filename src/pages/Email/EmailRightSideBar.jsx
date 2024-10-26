import { useEffect, useState } from "react";
import { SET_LOADING, DEBUG_MODE } from "@/utils/Constant";
import { EventBus } from "@/utils/Functions";
import EmailService from "@/services/email";
import { toast } from "react-hot-toast";
import parse from 'html-react-parser';

const EmailRightSideBar = (props) => {
  const {currentEmail} = props;
  const [viewEmail, setViewEmail] = useState(undefined);

  useEffect(() => {
        if (!currentEmail) return;
        EventBus.dispatch(SET_LOADING, true);
        EmailService.getEmailById(currentEmail.id) // get email by id content
            .then((res) => {
                if (res.status === 200) {
                    console.log("GOT EMAILS", res.data);
                    setViewEmail(res.data);
                } else if (res.status === 204) {
                    toast.error("There is no such email yet!");
                    setViewEmail(undefined);
                } else {
                    toast.error("An error has ocurred while getting mailbox content!");
                    setViewEmail(undefined);
                }
                EventBus.dispatch(SET_LOADING, false);
            })
            .catch((err) => {
                toast.error("An error has ocurred while getting mailbox content!");
                if (DEBUG_MODE) console.log(err);
                setViewEmail(undefined);
                EventBus.dispatch(SET_LOADING, false);
            })
    },[viewEmail && viewEmail.id, currentEmail]);
  return (
    <div className="flex flex-col  w-full px-2 h-[calc(100vh-160px)]">
      <div className="flex justify-left">
        {viewEmail && (
              <div className="w-full">
                <div className=" bg-gray-80">
                <div className="text-[#212121] text-lg mt-4 mb-4 ml-4">
                  {viewEmail.subject}
                </div>
                <div className="flex flex-col gap-1 text-[14px]">
                  <div className="w-full flex justify-between">
                    <div className="flex justify-left w-3/5">
                        <div className="text-[#757575] ml-2">From:</div>
                        <div className="text-[#212121] ml-4">{viewEmail.from}</div>
                    </div>
                    <div className="flex justify-left w-2/5">
                        <div className="text-[#757575]">To:</div>
                        <div className="text-[#212121] ml-4">{viewEmail.to}</div>
                    </div>
                  </div>
                  <div className="w-full flex justify-between">
                    <div className="flex justify-left">
                        <div className="text-[#757575] ml-2">Received:</div>
                        <div className="text-[#212121] ml-4">{viewEmail.headers.date}</div>
                    </div>
                    <div className="text-[#212121]">{viewEmail.attachments && (
                        <img
                          src="/image/FMListfileIcon.svg"
                          className="w-[20px] h-[20px] cursor-pointer"
                          alt="attachments"
                        />)}
                    </div>
                  </div>
                </div>
                </div>
                <hr/>
                <div className="text-[#757575] mt-4 overflow-y-auto">{parse(viewEmail.html)}</div>
              </div>
              )}
      </div>
    </div>
  );
};

export default EmailRightSideBar;
