import React, { useState, useRef } from 'react';
// Import the main component
import { Viewer } from '@react-pdf-viewer/core'; // install this library
// Plugins
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout'; // install this library
// Import the styles
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
// Worker
import { Worker } from '@react-pdf-viewer/core'; // install this library
import styled from 'styled-components';
import axios from 'axios';
import { format } from 'date-fns';

const StyledBox = styled.form`
  ${({ isDragFile }) => `
display:flex;
flex-direction:column;
justify-content:center;
align-items:center;
font-size: 1.25rem;
background-color: #c8dadf;
position: relative;
padding: 100px 20px;
display: flex;
justify-content: center;
outline-offset: -10px;
outline: ${isDragFile ? '2px dashed #92b0b3' : 'none'};
border-radius:5px;
;
`}
`;

export const App = () => {
  const inputRef = useRef(null);

  // Create new plugin instance
  const defaultLayoutPluginInstance = defaultLayoutPlugin();

  // for onchange event
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfFileError, setPdfFileError] = useState('');
  const [fileUpload, setFileUpload] = useState(null);
  const [isDragFile, setOnDragFile] = useState(false);
  const [signature, setSignature] = useState(null);
  const [signatureError, setSignatureError] = useState(false);
  const [onLoading, setOnLoading] = useState(false);

  // for submit event
  const [viewPdf, setViewPdf] = useState(null);

  // onchange event
  const fileType = ['application/pdf'];
  const handlePdfFileChange = (e) => {
    const [selectedFile] = e.target.files;
    handleChooseFile(selectedFile);
  };

  const handleChooseFile = (file) => {
    setFileUpload(file);
    setOnDragFile(false);
    if (file) {
      if (file && fileType.includes(file.type)) {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = (e) => {
          setPdfFile(e.target.result);
          setPdfFileError('');
        };
      } else {
        setPdfFile(null);
        setPdfFileError('chọn đúng định dạng file PDF');
      }
    } else {
      console.log('select your file');
    }
  };
  const toBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });

  // form submit
  const handlePdfFileSubmit = async (e) => {
    e.preventDefault();
    if (pdfFile !== null) {
      setOnLoading(true);
      setViewPdf(pdfFile);
      try {
        const base = await toBase64(fileUpload);
        const config = {
          method: 'post',
          url: 'https://pdf-verify.herokuapp.com/verify-pdf',
          data: {
            bytes: base.replace('data:application/pdf;base64,', ''),
            mimeTyString: {
              mimeTypeString: 'pdf',
            },
          },
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json',
          },
        };

        const result = await axios.request(config);
        setSignature(result.data.data);
        setOnLoading(false);
      } catch (error) {
        setSignatureError(true);
        setOnLoading(false);
      }
    } else {
      setViewPdf(null);
    }
  };
  const dragOver = (e) => {
    e.preventDefault();
    setOnDragFile(true);
  };

  const dragEnter = (e) => {
    e.preventDefault();
    setOnDragFile(true);
  };

  const dragLeave = (e) => {
    e.preventDefault();
    setOnDragFile(false);
  };
  const fileDrop = (e) => {
    e.preventDefault();
    const { files } = e.dataTransfer;
    handleChooseFile(files[0]);
  };
  const handleReset = () => {
    setPdfFile(null);
    setPdfFileError('');
    setFileUpload(null);
    setViewPdf(null);
    setSignature(null);
    setSignatureError(false);
  };
  return (
    <div className="container p-3">
      {signature ? (
        <>
          <div className="col text-center">
            <button onClick={handleReset} className="btn btn-primary btn-md mb-4 w-25">
              Tải lại
            </button>
          </div>
          <div className="d-flex">
            <div className="order-2 ml-4">
              <h4 className="text-center mb-4 text-primary">Thông tin chữ ký</h4>
              {signatureError ? (
                <div className="error-msg text-md text-center text-md">Văn bản chưa được ký</div>
              ) : (
                <div className="text-center">
                  {signature &&
                    (signature.signaturesReports.diagnosticData.signatures ?? []).map((sig) => {
                      const sigDetail = (signature.signaturesReports.diagnosticData.usedCertificates ?? []).find(
                        (item) => item.id === sig.signingCertificate.id,
                      );
                      return (
                        <div className="mb-2" style={{ borderBottom: '1px solid gray' }}>
                          <p>{`Người ký : ${sigDetail.commonName}`}</p>
                          <p>{`Địa chỉ : ${sigDetail.locality || ''} ${sigDetail.state || ''}`}</p>
                          <p>{`Email : ${sigDetail.email}`}</p>
                          <p>{`Ngày ký : ${format(new Date(sig.dateTime), 'dd-MM-yy hh:mm:a')}`}</p>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
            <div className="order-1">
              <h4 className="text-center mb-4 text-primary">Nội dung văn bản</h4>
              <div className="pdf-container">
                <Worker workerUrl="https://unpkg.com/pdfjs-dist@2.6.347/build/pdf.worker.min.js">
                  <Viewer fileUrl={viewPdf} plugins={[defaultLayoutPluginInstance]} />
                </Worker>
              </div>
            </div>
          </div>
        </>
      ) : (
        <StyledBox
          className="form-box"
          onDragOver={dragOver}
          onDragEnter={dragEnter}
          onDragLeave={dragLeave}
          onDrop={fileDrop}
          isDragFile={isDragFile}
        >
          {onLoading ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              xmlnsXlink="http://www.w3.org/1999/xlink"
              width="200px"
              height="200px"
              viewBox="0 0 100 100"
              preserveAspectRatio="xMidYMid"
            >
              <circle cx="84" cy="50" r="10" fill="#e15b64">
                <animate
                  attributeName="r"
                  repeatCount="indefinite"
                  dur="0.25s"
                  calcMode="spline"
                  keyTimes="0;1"
                  values="10;0"
                  keySplines="0 0.5 0.5 1"
                  begin="0s"
                />
                <animate
                  attributeName="fill"
                  repeatCount="indefinite"
                  dur="1s"
                  calcMode="discrete"
                  keyTimes="0;0.25;0.5;0.75;1"
                  values="#e15b64;#abbd81;#f8b26a;#f47e60;#e15b64"
                  begin="0s"
                />
              </circle>
              <circle cx="16" cy="50" r="10" fill="#e15b64">
                <animate
                  attributeName="r"
                  repeatCount="indefinite"
                  dur="1s"
                  calcMode="spline"
                  keyTimes="0;0.25;0.5;0.75;1"
                  values="0;0;10;10;10"
                  keySplines="0 0.5 0.5 1;0 0.5 0.5 1;0 0.5 0.5 1;0 0.5 0.5 1"
                  begin="0s"
                />
                <animate
                  attributeName="cx"
                  repeatCount="indefinite"
                  dur="1s"
                  calcMode="spline"
                  keyTimes="0;0.25;0.5;0.75;1"
                  values="16;16;16;50;84"
                  keySplines="0 0.5 0.5 1;0 0.5 0.5 1;0 0.5 0.5 1;0 0.5 0.5 1"
                  begin="0s"
                />
              </circle>
              <circle cx="50" cy="50" r="10" fill="#f47e60">
                <animate
                  attributeName="r"
                  repeatCount="indefinite"
                  dur="1s"
                  calcMode="spline"
                  keyTimes="0;0.25;0.5;0.75;1"
                  values="0;0;10;10;10"
                  keySplines="0 0.5 0.5 1;0 0.5 0.5 1;0 0.5 0.5 1;0 0.5 0.5 1"
                  begin="-0.25s"
                />
                <animate
                  attributeName="cx"
                  repeatCount="indefinite"
                  dur="1s"
                  calcMode="spline"
                  keyTimes="0;0.25;0.5;0.75;1"
                  values="16;16;16;50;84"
                  keySplines="0 0.5 0.5 1;0 0.5 0.5 1;0 0.5 0.5 1;0 0.5 0.5 1"
                  begin="-0.25s"
                />
              </circle>
              <circle cx="84" cy="50" r="10" fill="#f8b26a">
                <animate
                  attributeName="r"
                  repeatCount="indefinite"
                  dur="1s"
                  calcMode="spline"
                  keyTimes="0;0.25;0.5;0.75;1"
                  values="0;0;10;10;10"
                  keySplines="0 0.5 0.5 1;0 0.5 0.5 1;0 0.5 0.5 1;0 0.5 0.5 1"
                  begin="-0.5s"
                />
                <animate
                  attributeName="cx"
                  repeatCount="indefinite"
                  dur="1s"
                  calcMode="spline"
                  keyTimes="0;0.25;0.5;0.75;1"
                  values="16;16;16;50;84"
                  keySplines="0 0.5 0.5 1;0 0.5 0.5 1;0 0.5 0.5 1;0 0.5 0.5 1"
                  begin="-0.5s"
                />
              </circle>
              <circle cx="16" cy="50" r="10" fill="#abbd81">
                <animate
                  attributeName="r"
                  repeatCount="indefinite"
                  dur="1s"
                  calcMode="spline"
                  keyTimes="0;0.25;0.5;0.75;1"
                  values="0;0;10;10;10"
                  keySplines="0 0.5 0.5 1;0 0.5 0.5 1;0 0.5 0.5 1;0 0.5 0.5 1"
                  begin="-0.75s"
                />
                <animate
                  attributeName="cx"
                  repeatCount="indefinite"
                  dur="1s"
                  calcMode="spline"
                  keyTimes="0;0.25;0.5;0.75;1"
                  values="16;16;16;50;84"
                  keySplines="0 0.5 0.5 1;0 0.5 0.5 1;0 0.5 0.5 1;0 0.5 0.5 1"
                  begin="-0.75s"
                />
              </circle>
            </svg>
          ) : (
            <>
              <div style={{ cursor: 'pointer' }} onClick={() => inputRef.current && inputRef.current.click()}>
                <svg
                  className="box__icon"
                  xmlns="http://www.w3.org/2000/svg"
                  width="50"
                  height="43"
                  viewBox="0 0 50 43"
                >
                  <path d="M48.4 26.5c-.9 0-1.7.7-1.7 1.7v11.6h-43.3v-11.6c0-.9-.7-1.7-1.7-1.7s-1.7.7-1.7 1.7v13.2c0 .9.7 1.7 1.7 1.7h46.7c.9 0 1.7-.7 1.7-1.7v-13.2c0-1-.7-1.7-1.7-1.7zm-24.5 6.1c.3.3.8.5 1.2.5.4 0 .9-.2 1.2-.5l10-11.6c.7-.7.7-1.7 0-2.4s-1.7-.7-2.4 0l-7.1 8.3v-25.3c0-.9-.7-1.7-1.7-1.7s-1.7.7-1.7 1.7v25.3l-7.1-8.3c-.7-.7-1.7-.7-2.4 0s-.7 1.7 0 2.4l10 11.6z" />
                </svg>
              </div>
              <input
                type="file"
                className="form-control"
                required
                onChange={handlePdfFileChange}
                ref={inputRef}
                accept="application/pdf"
              />
              {fileUpload && !pdfFileError && (
                <label htmlFor="file" className="text-info">
                  {fileUpload.name}
                </label>
              )}
              {pdfFileError && <div className="error-msg text-md text-center">{pdfFileError}</div>}
              <label htmlFor="file" onClick={() => inputRef.current && inputRef.current.click()}>
                <strong style={{ cursor: 'pointer' }}>Chọn tập tin</strong>
                <span className="box__dragndrop"> hoặc kéo thả vào đây!</span>
              </label>
              {pdfFile && (
                <button onClick={handlePdfFileSubmit} className="btn btn-success btn-md">
                  UPLOAD
                </button>
              )}
            </>
          )}
        </StyledBox>
      )}
    </div>
  );
};

export default App;
