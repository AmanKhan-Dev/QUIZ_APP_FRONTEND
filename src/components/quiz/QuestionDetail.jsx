import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/mode-c_cpp'; 
import 'ace-builds/src-noconflict/theme-github'; 
import 'ace-builds/src-noconflict/ext-language_tools'; 
import './QuestionDetail.css'; // Create a separate CSS file for styles

const QuestionDetail = () => {
  const { questionSetId, questionNo } = useParams();
  const navigate = useNavigate();
  const [questionData, setQuestionData] = useState(null);
  const [error, setError] = useState(null);
  const [sourceCode, setSourceCode] = useState('');
  const [language, setLanguage] = useState('c_cpp');
  const [userInput, setUserInput] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState('');

  useEffect(() => {
    const fetchQuestionData = async () => {
      try {
        const response = await axios.get(`http://localhost:8080/codingQuestions/questions/${questionSetId}/${questionNo}`);
        setQuestionData(response.data);
      } catch (err) {
        setError('Error fetching question data');
      }
    };

    fetchQuestionData();
  }, [questionSetId, questionNo]);

  const handleCompileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:8080/api/compiler/compile', {
        sourceCode,
        language: language === 'c_cpp' ? 'C++' : 'C',
        userInput
      });
      const resultData = response.data;
      setResult(resultData);
      const testCasesPassed = checkTestCases(resultData);
      alert(testCasesPassed ? 'Sample Input And Output Matched' : 'Some test cases did not pass');
    } catch (error) {
      setResponse(`Error: ${error.response ? error.response.data : error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const compileResponse = await axios.post('http://localhost:8080/api/compiler/compile', {
        sourceCode,
        language: language === 'c_cpp' ? 'C++' : 'C',
        userInput
      });

      const resultData = compileResponse.data;
      setResult(resultData);

      const verifyResponse = await axios.post('http://localhost:8080/api/compiler/compileTests', {
        sourceCode,
        language,
        questionSetId,
        questionNo,
      });

      setResponse(verifyResponse.data);
      const testCasesPassed = checkTestCases(resultData);
      if (verifyResponse.status === 200 && testCasesPassed) {
        alert("All Test Case Varified");
        navigate(-1); // Redirect to the previous page
      }
    } catch (error) {
      setResponse(`Error: ${error.response ? error.response.data : error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRunCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:8080/api/compiler/compile', {
        sourceCode,
        language: language === 'c_cpp' ? 'C++' : 'C',
        userInput
      });

      const resultData = response.data;
      setResult(resultData);
      const testCasesPassed = checkTestCases(resultData);
      alert(testCasesPassed ? 'Sample Input And Output Matched' : 'Some test cases did not pass');
    } catch (error) {
      setResponse(`Error: ${error.response ? error.response.data : error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const checkTestCases = (result) => {
    if (questionData) {
      const { test_case_output, test_case_input } = questionData;
      if (test_case_output && test_case_input) {
        const testCaseInputs = test_case_input.split('|').map(input => input.trim());
        const testCaseOutputs = test_case_output.split('|').map(output => output.trim());
        let allTestsPassed = true;

        const resultString = String(result).trim();
        for (let i = 0; i < testCaseOutputs.length; i++) {
          const expectedOutput = testCaseOutputs[i];
          const normalizedExpectedOutput = expectedOutput.replace(/\r\n|\r|\n/g, '\n').trim();
          const normalizedResultString = resultString.replace(/\r\n|\r|\n/g, '\n').trim();

          if (normalizedExpectedOutput !== normalizedResultString) {
            allTestsPassed = false;
          }
        }

        if (!testCaseInputs.includes(userInput.trim())) {
          allTestsPassed = false;
        }

        return allTestsPassed;
      } else {
        alert('Test case input or output not available');
        return false;
      }
    } else {
      alert('Question data not available');
      return false;
    }
  };

  const handleEditorLoad = (editor) => {
    editor.setOptions({
      enableBasicAutocompletion: true,
      enableLiveAutocompletion: true
    });
  };

  return (
    <div className="question-detail-container">
      <div className="question-info">
        <h2>Question Details</h2>
        {error && <div className="error-message">{error}</div>}
        {questionData ? (
          <div className="question-card">
            <p><strong>Question Set ID:</strong> {questionData.questionSetId}</p>
            <p><strong>Question No:</strong> {questionData.questionNo}</p>
            <p><strong>Question:</strong> {questionData.question}</p>
            {questionData.question_description && (
              <p><strong>Description:</strong> <pre>{questionData.question_description}</pre></p>
            )}
            {questionData.test_case_input && (
              <p><strong>Test Case Input:</strong> <pre>{questionData.test_case_input}</pre></p>
            )}
            {questionData.test_case_output && (
              <p><strong>Test Case Output:</strong> <pre>{questionData.test_case_output}</pre></p>
            )}
          </div>
        ) : (
          <div className="loading">Loading...</div>
        )}
      </div>

      <div className="code-editor-section">
        <AceEditor
          mode={language}
          theme="github"
          name="codeEditor"
          value={sourceCode}
          onChange={(newValue) => setSourceCode(newValue)}
          width="100%"
          height="400px"
          editorProps={{ $blockScrolling: true }}
          style={{ borderRadius: '4px', border: '1px solid #ddd' }}
          onLoad={handleEditorLoad}
        />
        <form onSubmit={handleVerifySubmit} className="code-form">
          <div className="form-group">
            <label htmlFor="language">Language:</label>
            <select
              id="language"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="language-select"
            >
              <option value="c_cpp">C</option>
            </select>
          </div>
          <textarea
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Enter input for your program (if any)"
            rows="4"
            className="user-input"
          />
          <div className="button-group">
            <button
              type="submit"
              className="verify-button"
            >
              Verify
            </button>
            <button
              onClick={handleRunCode}
              className="run-code-button"
            >
              Run Code
            </button>
          </div>
          {loading && <div className="loading">Loading...</div>}
          <pre className="result-output">{result}</pre>
        </form>
        {response && (
          <div className="response-container">
            <h3>Response:</h3>
            <pre>{response}</pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionDetail;
