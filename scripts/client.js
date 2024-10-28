document.addEventListener('DOMContentLoaded', function () {
    const fileInput = document.getElementById('Upload');
    const formatSelect = document.getElementById('FormatSelector');
    const convertButton = document.getElementById('UploadConvertButton');
    const uploadStatus = document.getElementById('UploadConvertStatus');
    const closeStatusButton = document.getElementById('UploadConvertStatusClose');
    const notificationSound = document.getElementById('NotificationSound');

    let selectedFiles = [];
    let selectedFormat = 'jpg';

    if (!fileInput || !formatSelect || !convertButton || !uploadStatus || !closeStatusButton) {
        console.error('Required elements are missing.');
        return;
    }

    fileInput.addEventListener('change', handleFileInputChange, false);

    function handleFileInputChange(e) {
        selectedFiles = Array.from(e.target.files);
        updateUploadStatus('info');
        if (selectedFiles.length > 0) {
            updateUploadStatus('converting');
            convertButton.textContent = 'Converting...';
            if (selectedFiles.length === 1) {
                convertSingleFile(selectedFiles[0]);
            } else {
                convertMultipleFiles(selectedFiles);
            }
        }
    }

    function updateUploadStatus(type) {
        uploadStatus.classList.remove('hidden');

        if (type === 'error') {
            uploadStatus.classList.add('bg-red-500', 'text-white');
            uploadStatus.classList.remove('bg-green-500');
            uploadStatus.querySelector('#UploadConvertStatusMessage').textContent = 'Error occurred, please check console!';
            convertButton.textContent = 'Error';
            notificationSound.play();
        } else if (type === 'success') {
            uploadStatus.classList.add('bg-green-500', 'text-white');
            uploadStatus.classList.remove('bg-red-500');
            uploadStatus.querySelector('#UploadConvertStatusMessage').textContent = 'Conversion successful. Download will start shortly. Please wait.';
            notificationSound.play();
        } else if (type === 'converting') {
            uploadStatus.classList.add('bg-yellow-500', 'text-white');
            uploadStatus.classList.remove('bg-red-500', 'bg-green-500', 'bg-blue-500');
            uploadStatus.querySelector('#UploadConvertStatusMessage').textContent = 'Converting...';
        } else {
            uploadStatus.classList.add('bg-blue-500', 'text-white');
            uploadStatus.classList.remove('bg-red-500', 'bg-green-500');
            uploadStatus.querySelector('#UploadConvertStatusMessage').textContent = `${selectedFiles.length > 0 ? `${selectedFiles.length} file(s) selected.` : 'No files selected.'}`;
        }
    }

    formatSelect.addEventListener('change', function () {
        selectedFormat = formatSelect.value;
    });

    convertButton.addEventListener('click', function () {
        if (selectedFiles.length === 0) {
            fileInput.click();
        }
    });

    function convertSingleFile(file) {
        const reader = new FileReader();

        reader.onload = function (e) {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();

            img.onload = function () {
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);

                const dataUrl = canvas.toDataURL(`image/${selectedFormat}`);
                const a = document.createElement('a');
                const originalName = file.name.split('.').slice(0, -1).join('.') + `.${selectedFormat}`;
                a.href = dataUrl;
                a.download = originalName;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);

                updateUploadStatus('success');
                convertButton.textContent = 'Conversion successful';
                setTimeout(() => location.reload(), 2000);
            };

            img.onerror = function () {
                console.error('Image loading error');
                updateUploadStatus('error');
                convertButton.textContent = 'Error occurred, please check console!';
                convertButton.disabled = true;
            };

            img.src = e.target.result;
        };

        reader.onerror = function () {
            console.error('File reading error');
            updateUploadStatus('error');
            convertButton.textContent = 'Error occurred, please check console!';
            convertButton.disabled = true;
        };

        reader.readAsDataURL(file);
    }

    function convertMultipleFiles(files) {
        const zip = new JSZip();

        Promise.all(files.map(file => {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();

                reader.onload = function (e) {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    const img = new Image();

                    img.onload = function () {
                        canvas.width = img.width;
                        canvas.height = img.height;
                        ctx.drawImage(img, 0, 0);

                        const dataUrl = canvas.toDataURL(`image/${selectedFormat}`);
                        const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, '');
                        zip.file(`${file.name.split('.')[0]}.${selectedFormat}`, base64Data, { base64: true });
                        resolve();
                    };

                    img.onerror = function () {
                        console.error('Image loading error');
                        reject();
                    };

                    img.src = e.target.result;
                };

                reader.onerror = function () {
                    console.error('File reading error');
                    reject();
                };

                reader.readAsDataURL(file);
            });
        })).then(() => {
            zip.generateAsync({ type: 'blob' }).then(function (content) {
                const a = document.createElement('a');
                a.href = URL.createObjectURL(content);
                a.download = 'images.zip';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);

                updateUploadStatus('success');
                convertButton.textContent = 'Conversion successful';
                convertButton.disabled = true;
                setTimeout(() => location.reload(), 2000);
            });
        }).catch(() => {
            updateUploadStatus('error');
            convertButton.textContent = 'Error occurred, please check console!';
        });
    }

    closeStatusButton.addEventListener('click', function () {
        uploadStatus.classList.add('hidden');
    });
});
