export const processHierarchyAndData = (hierarchy, allData) => {
  const hierarchyLists = {};
  let hierarchicalData = {};

  try {
    // Process hierarchy
    hierarchy.forEach((item) => {
      hierarchyLists[item.boundaryType] = [];
    });

    // Process all sets of data
    allData.forEach((data) => {
      const dataHierarchicalData = {};

      // Process data for this set
      data.slice(1).forEach((row) => {
        // Exclude the header row
        let currentNode = dataHierarchicalData;
        hierarchy.forEach((item, index) => {
          const boundaryType = item.boundaryType;
          const dataIndex = data?.[0].indexOf(boundaryType);
          if (dataIndex === -1) return;
          const cellValue = row[dataIndex];
          // if (!cellValue) return;
          // Populate hierarchy lists
          if (!hierarchyLists[boundaryType].includes(cellValue) && cellValue !== null && cellValue !== "" && cellValue !== undefined) {
            hierarchyLists[boundaryType].push(cellValue);
          }

          // Populate hierarchical data
          if (!currentNode[cellValue]) {
            currentNode[cellValue] = {
              name: cellValue,
              boundaryType: boundaryType,
              children: {},
              data: null,
            };
          }

          // Assign row data to the correct hierarchical level
          if (index === hierarchy.length - 1) {
            currentNode[cellValue].data = createDataObject(data[0], row);
          }

          currentNode = currentNode[cellValue].children;
        });
      });

      // Merge dataHierarchicalData into hierarchicalData
      hierarchicalData = mergeHierarchicalData(hierarchicalData, dataHierarchicalData);
    });

    // Remove null element from children of each province
    Object.values(hierarchicalData).forEach((country) => {
      if (country.children[null]) {
        country.data = country.children[null].data;
        delete country.children[null];
      }
    });
  } catch (error) {
    // Return empty objects in case of error
    return { hierarchyLists: {}, hierarchicalData: {} };
  }

  return { hierarchyLists, hierarchicalData };
};

// Function to merge two hierarchical data objects
const mergeHierarchicalData = (data1, data2) => {
  for (const [key, value] of Object.entries(data2)) {
    if (!data1[key]) {
      data1[key] = value;
    } else {
      data1[key].data = value.data; // Merge data
      mergeHierarchicalData(data1[key].children, value.children); // Recursively merge children
    }
  }
  return data1;
};

// Function to create a data object with key-value pairs from headers and row data
const createDataObject = (headers, row) => {
  const dataObject = {};
  headers.forEach((header, index) => {
    dataObject[header] = row[index];
  });
  return dataObject;
};

// Find parent in hierarchy
export const findParent = (name, hierarchy, parent, accumulator = []) => {
  if (!name || !hierarchy) return null;
  for (let key in hierarchy) {
    if (hierarchy[key]?.name == name) {
      accumulator.push(parent);
    }
    if (hierarchy[key]?.children) {
      let response = findParent(name, hierarchy[key]?.children, hierarchy[key], accumulator);
      if (response)
        response.forEach((item) => {
          if (!accumulator.includes(item)) {
            accumulator.push(item);
          }
        });
    } else {
      return accumulator;
    }
  }
  return accumulator;
};

/**
 *
 * @param {Array of parents} parents
 * @param {hierarchycal Object data} hierarchy
 * @returns An Array containing all the cummulative children
 */
export const findChildren = (parents, hierarchy) => {
  const hierarchyTraveller = (parents, hierarchy, accumulator = {}) => {
    let tempData = [];
    if (accumulator && Object.keys(accumulator).length !== 0)
      tempData = {
        ...accumulator,
        ...hierarchy.reduce((data, item) => {
          if (parents.includes(item?.name) && item?.children) data = { ...data, ...item?.children };
          return data;
        }, {}),
      };
    else
      tempData = hierarchy.reduce((data, item) => {
        if (parents.includes(item?.name) && item?.children) data = { ...data, ...item?.children };
        return data;
      }, {});
    for (let parent of hierarchy) {
      if (parent?.children) tempData = hierarchyTraveller(parents, Object.values(parent?.children), tempData);
    }
    return tempData;
  };
  return hierarchyTraveller(parents, Object.values(hierarchy), {});
};

export const fetchDropdownValues = (boundaryData, hierarchy, boundarySelections) => {
  if (
    !hierarchy ||
    !boundaryData ||
    !boundarySelections ||
    hierarchy.length === 0 ||
    Object.keys(hierarchy).length === 0 ||
    Object.keys(boundaryData).length === 0
  )
    return [];
  let TempHierarchy = _.cloneDeep(hierarchy);
  if (!boundarySelections || Object.values(boundarySelections)?.every((item) => item?.length == 0)) {
    for (let i in TempHierarchy) {
      if (i === "0") {
        TempHierarchy[0].dropDownOptions = findByBoundaryType(
          TempHierarchy?.[0]?.boundaryType,
          Object.values(boundaryData)?.[0]?.hierarchicalData
        ).map((data, index) => ({
          name: data,
          code: data,
          boundaryType: TempHierarchy?.[0]?.boundaryType,
          parentBoundaryType: undefined,
        }));
      } else TempHierarchy[i].dropDownOptions = [];
    }
  } else {
    const currentHierarchy = findCurrentFilteredHierarchy(Object.values(boundaryData)?.[0]?.hierarchicalData, boundarySelections, TempHierarchy);
    Object.entries(boundarySelections)?.forEach(([key, value]) => {
      let currentindex = hierarchy.findIndex((e) => e?.boundaryType === key);
      let childIndex = hierarchy.findIndex((e) => e?.parentBoundaryType === key);
      if (childIndex == -1) return;
      if (TempHierarchy?.[childIndex]) {
        let newDropDownValuesForChild = Object.values(
          findChildren(
            value.map((item) => item.name),
            currentHierarchy
          )
        ).map((value) => ({
          name: value?.name,
          code: value?.name,
          boundaryType: TempHierarchy[childIndex]?.boundaryType,
          parentBoundaryType: TempHierarchy[childIndex]?.parentBoundaryType,
        }));
        // if (TempHierarchy[childIndex].dropDownOptions)
        //   TempHierarchy[childIndex].dropDownOptions = [...TempHierarchy[childIndex].dropDownOptions, ...newDropDownValuesForChild];
        TempHierarchy[childIndex].dropDownOptions = newDropDownValuesForChild;
      }
    });
  }
  return TempHierarchy;
};

const findByBoundaryType = (boundaryType, hierarchy) => {
  for (let [key, value] of Object.entries(hierarchy)) {
    if (value?.boundaryType === boundaryType) return Object.keys(hierarchy).filter(Boolean);
    else if (value?.children) return findByBoundaryType(boundaryType, value?.children);
    else return [];
  }
  return [];
};

// makes a tree with the boundary selections as there might be duplicates in different branches that are not yet selected
const findCurrentFilteredHierarchy = (hierarchyTree, boundarySelections, hierarchy) => {
  const newtree = constructNewHierarchyTree(hierarchy, hierarchyTree, boundarySelections);
  return newtree;
};

const constructNewHierarchyTree = (hierarchy, oldTree, boundarySelection, level = 0) => {
  // let newTree = { ...oldTree }; // Initialize a new hierarchy tree
  let newTree = {}; // Initialize a new hierarchy tree
  if (!hierarchy?.[level]) return;
  const levelName = hierarchy[level].boundaryType;

  // Get the selections for this level from the boundary selection object
  const selections = boundarySelection[levelName] || [];
  // If there are selections for this level
  if (selections.length > 0) {
    // Construct the new hierarchy tree based on selections
    for (const selection of selections) {
      const { name } = selection;
      // If the selection exists in the existing hierarchy tree
      if (oldTree[name]) {
        // Add the selected division to the new hierarchy tree
        newTree[name] = { ...oldTree[name] };
        // If there are children, recursively construct the children
        if (oldTree[name].children) {
          oldTree[name].children;
          const nonNullObject = Object.entries(oldTree[name].children).reduce((acc, [key, value]) => {
            if (value.name !== null) {
              acc[key] = value;
            }
            return acc;
          }, {});
          newTree[name].children = constructNewHierarchyTree(hierarchy, nonNullObject, boundarySelection, level + 1);
        }
      }
    }
  } else {
    const nonNullObject = Object.entries(oldTree).reduce((acc, [key, value]) => {
      if (value.name !== null) {
        acc[key] = value;
      }
      return acc;
    }, {});
    newTree = nonNullObject;
  }

  return newTree;
};