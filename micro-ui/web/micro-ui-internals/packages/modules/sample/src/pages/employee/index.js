import { AppContainer, BreadCrumb, PrivateRoute } from "@egovernments/digit-ui-react-components";
import React from "react";
import { useTranslation } from "react-i18next";
import { Route, Switch } from "react-router-dom";
import Sample from "./Sample";
 import SampleInbox from "./SampleInbox";
 import SampleSearch from "./SampleSearch";
import AdvancedCreate from "./AdvancedForm";
import Response from "./Response";
import SearchIndividual from "./SearchIndividual";
import CreateIndividual from "./CreateIndividual";
//import IndividualDetails from "./IndividualDetail";
import ViewIndividual from "../../configs/ViewIndividual";



const ProjectBreadCrumb = ({ location }) => {
  const { t } = useTranslation();
  const crumbs = [
    {
      path: `/${window?.contextPath}/employee`,
      content: t("HOME"),
      show: true,
    },
    {
      path: `/${window?.contextPath}/employee`,
      content: t(location.pathname.split("/").pop()),
      show: true,
    },
  ];
  return <BreadCrumb crumbs={crumbs} spanStyle={{ maxWidth: "min-content" }} />;
};

const App = ({ path, stateCode, userType, tenants }) => {
  const commonProps = { stateCode, userType, tenants, path };
  console.log(" aaapppppp")


  return (
    <Switch>
      <AppContainer className="ground-container">
        <React.Fragment>
          <ProjectBreadCrumb location={location} />
        </React.Fragment>
        <PrivateRoute path={`${path}/create`} component={() => <Create></Create>} />
        <PrivateRoute path={`${path}/advanced`} component={() => <AdvancedCreate></AdvancedCreate>} />
        <PrivateRoute path={`${path}/inbox`} component={() => <Inbox></Inbox>} />
        <PrivateRoute path={`${path}/sample/search`} component={() => <SearchWageSeeker></SearchWageSeeker>} />
        <PrivateRoute path={`${path}/response`} component={() => <Response></Response>} />
        <PrivateRoute path={`${path}/create-individual`} component={() => <CreateIndividual />} />
        <PrivateRoute path={`${path}/search-individual`} component={() => <SearchIndividual></SearchIndividual>} />
        <PrivateRoute path={`${path}/individual-details`} component={() => <ViewIndividual />} />
        
      </AppContainer>
    </Switch>
  );
};

export default App;