import { Card, PersonIcon, SubmitBar } from "@egovernments/digit-ui-react-components";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import axios from "axios";
import * as XLSX  from "xlsx";
//import { saveAs } from "file-saver";

const InboxLinks = ({ parentRoute, businessService, allLinks, headerText }) => {
  const { t } = useTranslation();
  const [links, setLinks] = useState([]);
  const { roles: userRoles } = Digit.UserService.getUser().info;
  useEffect(() => {
    let linksToShow = allLinks
      .filter((e) => e.businessService === businessService)
      .filter(({ roles }) => roles.some((e) => userRoles.map(({ code }) => code).includes(e)) || !roles.length);
    setLinks(linksToShow);
  }, []);
  const state = Digit.ULBService.getStateId();
  const {  data: phcMenu  } = Digit.Hooks.pgr.useMDMS(state, "tenant", ["tenants"]);
  const { isMdmsLoading, data: mdmsData } = Digit.Hooks.pgr.useMDMS(state, "Incident", ["District","Block"]);
  const tenantId = Digit.ULBService.getCurrentTenantId();
  const initialStates={
    searchParams:{
      tenantId:tenantId
    }
  }
  const [pageOffset, setPageOffset] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [sortParams, setSortParams] = useState([{ id: "createdTime", desc: false }]);
  const [totalRecords, setTotalReacords] = useState(undefined);
  const [searchParams, setSearchParams] = useState(() => {
    return initialStates.searchParams || {};
  });
 
  let isMobile = window.Digit.Utils.browser.isMobile();
  let paginationParams = isMobile
    ? { limit: 100, offset: pageOffset, sortOrder: sortParams?.[0]?.desc ? "DESC" : "ASC" }
    : { limit: 100, offset: pageOffset, sortOrder: sortParams?.[0]?.desc ? "DESC" : "ASC" };
  const isupdate = Digit.SessionStorage.get("isupdate");
  const { isLoading: hookLoading, isError, error, data, ...rest } = Digit.Hooks.hrms.useHRMSSearch(
    searchParams,
    tenantId,
    paginationParams,
    isupdate
  );
  useEffect(() => {
    setPageOffset(0);
  }, [searchParams]);
  const getExcelData=async(employeeDetails, tenantInfo, t)=>{
    const convertBoundary=(boundary)=>{
      const parts=t(`TENANT_TENANTS_${boundary.replace(".", "_").toUpperCase()}`);
      return parts;
    }
    const convertBlock=(block)=>{
      let extractedBlock=""
      if(block!==null && mdmsData!==undefined){
        const tenantData=mdmsData?.Incident?.Block.find(block=>block.code===block);
       
        const part=block.split(".")[1];
        
        extractedBlock=t(`${part.charAt(0).toUpperCase()+part.slice(1).toLowerCase()}`);
      } 
      return extractedBlock;
    }
    const consolidatedBoundariesByDistrict=(jurisdictions)=>{
      const groupedByDistrict=jurisdictions.reduce((acc, curr)=>{
        const {boundary, boundaryType, hierarchy, roles=[]}=curr;
        const tenantData=phcMenu?.tenant?.tenants?.find(tenant=>tenant.code===boundary);
        const district=tenantData?.city?.districtName;
        const block=tenantData?.city?.blockCode;
          if(!acc[district]){
            acc[district]={
              district,
              block:new Set(),
              boundary: new Set(),
              hierarchy,
              boundaryType,
              roles:new Set(),
            };
          }
          acc[district].block.add(block);
          acc[district].boundary.add(convertBoundary(boundary));
          roles.forEach(role=>acc[district].roles.add(role.code));
          return acc;
        },{});
        return Object.values(groupedByDistrict).map((group)=>({
          ...group,
          block:Array.from(group.block).join(",  "),
          boundary:Array.from(group.boundary).join(", "),
          roles:Array.from(group.roles).join(", ")
        }));
    };
    const updatedEmployeeDetails=employeeDetails.map(employee=>{
      let updatedJurisdictions=[];
      if(employee.jurisdictions){
        updatedJurisdictions=consolidatedBoundariesByDistrict(employee.jurisdictions);
      }
      return { ...employee, jurisdictions: updatedJurisdictions };
    })
    // employeeDetails.forEach(employee=>{
    //   if(employee.jurisdictions){
    //     const updatedJurisdictions=consolidatedBoundariesByDistrict(employee.jurisdictions);
    //     employee.jurisdictions=updatedJurisdictions;
    //   }
    // })
    
    const maxJurisdiction=Math.max(
      ...updatedEmployeeDetails.map(employee=>employee.jurisdictions.length)
    );
    const formattedData=updatedEmployeeDetails.map(employee=>{
      const baseData={
        "User Name":employee.user.name,
        "Employee Type":t(`${employee.employeeType}`),
        "No of Roles":employee.user?.roles.length,
        "Mobile Number":employee.user.mobileNumber,
        "Status":employee.isActive ? "ACTIVE" : "INACTIVE",
            
      };
      for(let jIndex=0; jIndex<maxJurisdiction; jIndex++){
        const jurisdiction=employee.jurisdictions[jIndex];
        
        if(jurisdiction!==undefined){
          baseData[`Jurisdiction ${jIndex+1} District`]=jurisdiction.district!==undefined ? jurisdiction.district!==null? jurisdiction.district:"NA":"-";
          baseData[`Jurisdiction ${jIndex+1} Block`]=jurisdiction.block!==undefined ? jurisdiction.block.length!==0 ?jurisdiction.block: "NA":"-";
          baseData[`Jurisdiction ${jIndex+1} Boundary`] = jurisdiction.boundary!==undefined? jurisdiction.boundary: "-";
        }else{
          baseData[`Jurisdiction ${jIndex+1} District`]="-";
          baseData[`Jurisdiction ${jIndex+1} Block`]="-";
          baseData[`Jurisdiction ${jIndex+1} Boundary`] = "-";
        }
        
          
     
      }
     
     
      return baseData;
      })
      
    
    return formattedData;
    
 };
  const handleDownloadExcel = async () => {
    const employeeDetails = data?.Employees ;
    const tenantInfo  = tenantId;
    const excelData = await getExcelData(employeeDetails, tenantInfo, t);
   
    if(excelData !== undefined){
      return Digit.Download.Excel(excelData , "EmployeeDetails");
    }
    // const worksheet=XLSX.utils.book_new();
    // XLSX.utils.book_append_sheet(workbook, worksheet, 'EmployeeDetails');
    // const excelBuffer=XLSX.write(workbook, {bookType:'xlsx', type:'array'});
    // const blob=new Blob([excelBuffer], {type:'application/octet-stream'});
    // saveAs(blob, 'Employee_Details.xlsx');
   
    //Digit.Utils.pdf.generate(excelData);
    
  };

  const GetLogo = () => (
    <div className="header" style={{paddingBottom:"0px", paddingTop:"25px"}}>
      <span className="logo">
        <PersonIcon />
      </span>{" "}
      <span className="text">{t(headerText)}</span>
    </div>
  );
  return (
    <Card className="employeeCard filter inboxLinks">
      <div className="complaint-links-container">
        {GetLogo()}
        <div className="body">
          {links.map(({ link, text, hyperlink = false, accessTo = [] }, index) => {
            return (
              <span className="link" style={{paddingBottom:"60px"}} key={index} >
                {hyperlink ? <a href={link}>{t(text)}</a> : <Link to={link} style={{color:"#7a2829"}}>{t(text)}</Link>}
              </span>
            );
          })}
        </div>
      </div>
      <SubmitBar style={{marginTop:"-210px", marginBottom:"10px", marginLeft:"10px", marginRight:"10px"}} label={t("HR_VIEW_DETAILS")} onSubmit={handleDownloadExcel}/>
    </Card>
  );
};

export default InboxLinks;