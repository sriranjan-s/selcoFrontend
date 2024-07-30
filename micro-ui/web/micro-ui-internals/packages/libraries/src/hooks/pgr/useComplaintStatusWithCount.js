import { useEffect, useState } from "react";
import useComplaintStatus from "./useComplaintStatus";

const useComplaintStatusCount = (complaints,tenant) => {
  const [complaintStatusWithCount, setcomplaintStatusWithCount] = useState([]);
  let complaintStatus = useComplaintStatus();
  let tenantId = Digit.ULBService.getCurrentTenantId();
  const [statusCount, setStatusCount]=useState();
  const inboxTotal=sessionStorage.getItem("inboxTotal");
 const { data, isLoading, isFetching, isSuccess } = Digit.Hooks.useNewInboxGeneral({
      tenantId: Digit.ULBService.getCurrentTenantId(),
      ModuleCode: "Incident",
      filters: { limit: 15, offset: 0, services: ["Incident"]},
      config: {
        select: (data) => {
          return data;
        },
        enabled: Digit.Utils.pgrAccess(),
      },  
    });
    useEffect(() => {
      if (!isFetching && isSuccess && !isLoading) {
        if(data!==undefined){
          const counts=data.items.reduce((acc, item)=>{
              const status=item.businessObject.incident.applicationStatus;
              if(status){
                acc[status]=(acc[status]|| 0)+1;
              }
              return acc; 
            },{});
            setStatusCount(counts);
        }
      };
      // 
    }, [isFetching, isSuccess,isLoading, data]);
  
  useEffect(() => {
    const getStatusWithCount = async () => {
        let statusWithCount = complaintStatus.map(async (status) => {
          const count=statusCount[status.code]||0;
          return{
            ...status,
            count: count,
          }
        });
        setcomplaintStatusWithCount(await Promise.all(statusWithCount));
      }
    if(complaintStatus.length>0 && statusCount!==undefined){
      getStatusWithCount();
    };
  }, [complaints, complaintStatus, statusCount]);
  return complaintStatusWithCount;
};

export default useComplaintStatusCount;