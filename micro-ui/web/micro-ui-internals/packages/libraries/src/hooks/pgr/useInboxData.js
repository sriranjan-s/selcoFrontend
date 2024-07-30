import { useQuery, useQueryClient } from "react-query";
import React, { useCallback, useEffect, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
const useInboxData = (searchParams,tenantIdNew) => {
  const { t } = useTranslation();
  let serviceIds = [];
  const inboxTotal=sessionStorage.getItem("inboxTotal");
    let commonFilters = { start: 1, end: 10 };
    const { limit, offset } = searchParams;
    let appFilters = { ...commonFilters, ...searchParams?.filters?.pgrQuery, ...searchParams?.search, limit, offset };
   let wfFilters
    if(searchParams?.filters?.wfFilters?.assignee?.[0]?.code !=="")
    {
     wfFilters = { ...commonFilters, ...searchParams?.filters?.wfQuery,assignee:searchParams?.filters?.wfFilters?.assignee?.[0]?.code}
    }
    else {
      wfFilters = { ...commonFilters, ...searchParams?.filters?.wfQuery}
    }
    const filterData=(data, appFilters)=>{
      const {phcType, incidentType, incidentId, applicationStatus, start, limit, offset, end}=appFilters;
      const filteredItems= data.data.items.filter(item=> {
        const incident = item.businessObject?.incident;
        if(!incident) return false;
        let matches= true;
        if(phcType) {
          const convertedPhc=t(`TENANT_TENANTS_${phcType.replace(".", "_").toUpperCase()}`);
          matches = matches && incident.phcType === convertedPhc;
        }
        if(incidentType) {
          matches = matches && incident.incidentType=== incidentType;
        }
        if(incidentId) {
          matches = matches && incident.incidentId=== incidentId;
        }
        if(applicationStatus){
          matches = matches && incident.applicationStatus=== applicationStatus;
        }
        return matches;
      });
      const totalItems=filteredItems.length;
      // const sortedItems=filteredItems.sort((a,b)=>{
      //   return b.businessObject?.auditDetails?.lastModifiedTime-a.businessObject?.auditDetails?.lastModifiedTime;
      // })
      const paginationItems=filteredItems.slice(offset, offset+limit);
      return {total: totalItems, items:paginationItems};
    };
  const { data, isLoading, isFetching, isSuccess } = Digit.Hooks.useNewInboxGeneral({
    tenantId: Digit.ULBService.getCurrentTenantId(),
    ModuleCode: "Incident",
    filters: {  limit: 15, offset: 0,  services: ["Incident"] },
    config: {
      select: (data) => {
        return {data: data} || "-";
      },
      enabled: Digit.Utils.pgrAccess(),
    },
      
    
  });
  const filteredData= useMemo(()=>{
    if(isSuccess && data){
      return filterData(data, appFilters)
    }
    return {total:0, item:[]}
  }, [data, isSuccess, appFilters]);

  useEffect(() => {
    if (!isFetching && isSuccess);
     
  }, [isFetching]);
  
  
  const client = useQueryClient();
  const fetchInboxData = async () => {
    let tenantId = Digit.ULBService.getCurrentTenantId();
    const tenants = Digit.SessionStorage.get("Tenants").map(item => item.code).join(',');
    const codes = Digit.SessionStorage.get("Tenants").filter(item => item.code !== "pg")
    .map(item => item.code)
    .join(',');
    const sessionTenantId = Digit.SessionStorage.get("Employee.tenantId");
    const isCodePresent = (array, codeToCheck) =>{
      return array.some(item => item.code === codeToCheck);
    }
    const userRoles = Digit.SessionStorage.get("User")?.info?.roles || [];
    if (searchParams?.filters?.pgrQuery?.phcType) {
      tenantId = searchParams.filters.pgrQuery.phcType;
    } else if (searchParams?.search?.phcType) {
      tenantId = searchParams.search.phcType === "pg" ? tenants : searchParams.search.phcType;
    } else {
      tenantId = sessionTenantId === "pg" ? isCodePresent(userRoles, "COMPLAINT_RESOLVER") ? codes:tenants : sessionTenantId;
    }

    //const tenant =  Digit.SessionStorage.get("Employee.tenantId") == "pg"?  Digit.SessionStorage.get("Tenants").map(item => item.code).join(',') :Digit.SessionStorage.get("Employee.tenantId") 
    
    
    
    let complaintDetailsResponse = null;
    let incidentDetails=null;
    let combinedRes = [];
    if(filteredData!==undefined&& filteredData?.items?.length>0){
      incidentDetails= filteredData.items.map(incident=>incident.businessObject.incident);
    }
    
    incidentDetails.forEach((incident) => serviceIds.push(incident.incidentId));
        const serviceIdParams = serviceIds.join();
    
    const workflowInstances = await Digit.WorkflowService.getByBusinessId(tenantId, serviceIdParams, wfFilters, false);
    if (workflowInstances.ProcessInstances.length>0) {
      combinedRes = combineResponses(incidentDetails, workflowInstances).map((data) => ({
        ...data,
        sla: Math.round(data.sla / (24 * 60 * 60 * 1000)),
      }));
      
    }
    
   
    return {combinedRes:combinedRes, total:filteredData?.total};
   
  };

  const result = useQuery(["fetchInboxData", 
  ...Object.keys(searchParams).map(i =>
      typeof searchParams[i] === "object" ? Object.keys(searchParams[i]).map(e => searchParams[i][e]) : searchParams[i]
     )],
  fetchInboxData,
  { staleTime: Infinity }
  );
    return { ...result, revalidate: () => client.refetchQueries(["fetchInboxData"]) };
 };

const mapWfBybusinessId = (wfs) => {
  return wfs.reduce((object, item) => {
    return { ...object, [item["businessId"]]: item };
  }, {});
};

const combineResponses = (incidentDetails, workflowInstances) => {
  let wfMap = mapWfBybusinessId(workflowInstances.ProcessInstances);
  let data = [];
  incidentDetails.map((incident) => {
    if (wfMap?.[incident.incidentId]) {
      data.push({
        incidentId: incident.incidentId,
        incidentType:incident.incidentType,
        incidentSubType: incident.incidentSubType,
        phcType:incident.phcType,
        //priorityLevel : complaint.service.priority,
        //locality: complaint.service.address.locality.code,
        status: incident.applicationStatus,
        taskOwner: wfMap[incident.incidentId]?.assignes?.[0]?.name || "-",
        sla: wfMap[incident.incidentId]?.businesssServiceSla,
        tenantId: incident.tenantId,
      })
    }});
    
  return data;
};

export default useInboxData;
