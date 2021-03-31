import React, { useState } from "react";
import Resultbox from "./Resultbox";
import Loading from "./Loading"
import "./TextBox.css";
import axios from "axios";

const api = `http://localhost:3001/`;

async function getRequest(Query, QueryType) {
  try {
    const response = await axios.get(`${api + "getResult"}`, {
      params: {
        query: Query,
        type: QueryType,
      },
    });
    return response.data;
  } catch (error) {
    console.error(error);
  }
}

function TextBox() {
  const [option, setOption] = useState("boolean");
  const [query, setQuery] = useState("");
  const [queryResult, setQueryResult] = useState([])
  const [flag, setFlag] = useState(false);
  const [load,setLoad] = useState(false)

  const changeoption = (e) => {
    setOption(e.target.value);
  };

  const grabquery = (e) => {
    setFlag(false)
    if (e.target.value == null || e.target.value === "")
    {
      setFlag(false)
    }
    setQuery(e.target.value);
    
  };

  async function print(e) {
    e.preventDefault();
    setFlag(false)
    setLoad(true)
    
    var queryResults = await getRequest(query, option);
    if (queryResults !== "" || queryResults != null)
    {
      setLoad(false);
      setFlag(true);
      
    }
    queryResults = JSON.stringify(queryResults);
    console.log(queryResults)
    setQueryResult(queryResults)
  }


  return (
    <div className="AddTransaction">
      <form onSubmit={print}>
        <input
          onChange={grabquery}
          value={query}
          type="text"
          placeholder="Enter Query Here"
        />
        <br />
        <div className="option">
          <label style={{ color: "white" }}>
            Choose Query Type{" "}
            <select value={option} onChange={changeoption}>
              <option value="boolean">Boolean Query</option>
              <option value="proximity">Proximity Query</option>
            </select>
          </label>
        </div>
        <br />

        <button onClick={print}>Search Query</button>
      </form>
      {load ? <Loading /> : <div></div>}
      {flag ? <Resultbox ans={queryResult} />: <div></div>}
    </div>
  );
}

export default TextBox;
