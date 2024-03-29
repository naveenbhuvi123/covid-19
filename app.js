const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "covid19India.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const convertDbObjectToResponseObject = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};

//GET STATES LIST API 1 
app.get("/states/", async (request, response) => {
  const getStatesQuery = `
      SELECT 
        * 
      FROM 
        state;`;
  const statesResponse = await db.all(getStatesQuery);
  response.send(
    statesResponse.map((eachState) =>
      convertDbObjectToResponseObject(eachState)
    )
  );
});

//GET STATE BASED ON STATE ID API-2
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `
     SELECT 
        *
      FROM 
        state
      WHERE 
       state_id = ${stateId};`;
  const stateDbResponse = await db.get(getStateQuery);
  response.send(convertDbObjectToResponseObject(stateDbResponse));
});

//CREATE DISTRICT  API 3
app.post("/districts/", async (request, response) => {
  const {
    districtId,
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = request.body;
  const addDistrictQuery = `
     INSERT INTO
       district (district_name,state_id,cases,cured,active,deaths)
     VALUES (
         '${districtName}',
          ${stateId},
          ${cases},
          ${cured},
          ${active},
          ${deaths}
     );`;
  const dbResponse = await db.run(addDistrictQuery);
  response.send("District Successfully Added");
});

const convertDbObjectToResponse = (dbObject) => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cases,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};

//GET DISTRICT API 4
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `
    SELECT
       * 
    FROM 
      district
    WHERE 
      district_id = ${districtId};`;
  const getDistrict = await db.get(getDistrictQuery);
  response.send(convertDbObjectToResponse(getDistrict));
});

//DELETE DISTRICT API 5
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `
    DELETE FROM 
      district
    WHERE 
      district_id = ${districtId};`;
  const getDistrict = await db.run(getDistrictQuery);
  response.send("District Removed");
});


//UPDATE DETAILS OF DISTRICT  API 6
app.put("/districts/:districtId/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const { districtId } = request.params;
  const updateDistrictQuery = `
    UPDATE 
      district
    SET 
       district_name ='${districtName}',
       state_id =${stateId},
       cases =  ${cases},
       cured = ${cured},
       active = ${active},
       deaths = ${deaths}
    WHERE 
       district_id = ${districtId};`;
  const updateDistrict = await db.run(updateDistrictQuery);
  response.send("District Details Updated");
});

//GET DISTRICT INFO API 7
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStateStatsQuery = `
    SELECT 
       SUM(cases),
       SUM(cured),
       SUM(active),
       SUM(deaths)
     FROM 
     district
     WHERE 
          state_id = ${stateId};`;
  const getStates = await db.get(getStateStatsQuery);
  console.log(getStates);
  response.send({
    totalCases: getStates["SUM(cases)"],
    totalCured: getStates["SUM(cured)"],
    totalActive: getStates["SUM(active)"],
    totalDeaths: getStates["SUM(deaths)"],
  });
});

//GET STATENAME API 8
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const stateDetails = `
   SELECT state_name as stateName
   FROM state JOIN district
      ON state.state_id = district.state_id
    WHERE district.district_id = ${districtId};`;
  const stateName = await db.get(stateDetails);
  response.send(stateName);
});

module.exports = app;
