export const useGenerateIdCampaign = (type ,hierarchyType, filters) => {
  const updatedFilters = filters?.map(({ type, ...rest }) => ({
    ...rest,
    boundaryType: type
}));
  const reqCriteria = {
    url: `/project-factory/v1/data/_generate`,
    changeQueryName :`${type}${hierarchyType}${filters}`,
    params: {
      tenantId:  Digit.ULBService.getCurrentTenantId(),
      type: type,
      forceUpdate: true,
      hierarchyType: hierarchyType,
    },
    body: (type === 'boundary' ? (updatedFilters === undefined ? { "Filters": null } : { "Filters": { "boundaries": updatedFilters } }) : {}),
  };

  const { data: Data } = Digit.Hooks.useCustomAPIHook(reqCriteria);

  return Data?.GeneratedResource?.[0]?.id;
};