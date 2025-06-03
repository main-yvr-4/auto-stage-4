import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Layout,
  Menu,
  Typography,
  Card,
  Button,
  Upload,
  message,
  Tag,
  Space,
  Divider,
  Progress,
  Statistic,
  Row,
  Col,
  Input,
  Select,
  Spin,
  Alert,
  Dropdown,
  Modal
} from 'antd';
import {
  ArrowLeftOutlined,
  UploadOutlined,
  InboxOutlined,
  PictureOutlined,
  DatabaseOutlined,
  TagOutlined,
  RobotOutlined,
  EyeOutlined,
  DeploymentUnitOutlined,
  BulbOutlined,
  HistoryOutlined,
  SettingOutlined,
  FolderOutlined,
  CloudUploadOutlined,
  YoutubeOutlined,
  ApiOutlined,
  CloudOutlined,
  PlusOutlined,
  MoreOutlined,
  ExportOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DeleteOutlined,
  EditOutlined
} from '@ant-design/icons';
import { projectsAPI, handleAPIError } from '../services/api';

const { Sider, Content } = Layout;
const { Title, Text, Paragraph } = Typography;
const { Dragger } = Upload;
const { Option } = Select;

const ProjectWorkspace = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedKey, setSelectedKey] = useState('upload');
  const [uploading, setUploading] = useState(false);

  // Load project details
  const loadProject = async () => {
    setLoading(true);
    try {
      const projectData = await projectsAPI.getProject(projectId);
      setProject(projectData);
    } catch (error) {
      const errorInfo = handleAPIError(error);
      message.error(`Failed to load project: ${errorInfo.message}`);
      console.error('Load project error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      loadProject();
    }
  }, [projectId]);

  // Get project type info for styling
  const getProjectTypeInfo = (type) => {
    const typeInfo = {
      'object_detection': { color: 'blue', label: 'Object Detection' },
      'classification': { color: 'green', label: 'Classification' },
      'segmentation': { color: 'purple', label: 'Instance Segmentation' }
    };
    return typeInfo[type] || { color: 'default', label: type };
  };

  const [batchName, setBatchName] = useState('');
  const [tags, setTags] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [availableDatasets, setAvailableDatasets] = useState([]);
  const [batchNameModalVisible, setBatchNameModalVisible] = useState(false);
  const [pendingFiles, setPendingFiles] = useState([]);
  const [uploadType, setUploadType] = useState('files'); // 'files' or 'folder'
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);
  const [recentImages, setRecentImages] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [managementData, setManagementData] = useState(null);
  const [loadingManagement, setLoadingManagement] = useState(false);
  
  // Rename modal state
  const [renameModalVisible, setRenameModalVisible] = useState(false);
  const [renamingDataset, setRenamingDataset] = useState(null);
  const [newDatasetName, setNewDatasetName] = useState('');

  // Load available datasets for tags dropdown (only unassigned datasets)
  const loadAvailableDatasets = async () => {
    try {
      if (managementData && managementData.unassigned && managementData.unassigned.datasets) {
        const datasets = managementData.unassigned.datasets.map(dataset => ({
          label: dataset.name,
          value: dataset.name
        }));
        setAvailableDatasets(datasets);
      }
    } catch (error) {
      console.error('Error loading datasets:', error);
    }
  };

  // Handle file selection - ask for batch name
  const handleFileSelect = () => {
    setUploadType('files');
    // Only show batch name modal if no tags are selected
    if (tags.length === 0) {
      setBatchNameModalVisible(true);
    } else {
      // Tags are selected, proceed directly to file selection
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
    }
  };

  // Handle folder selection - auto-use folder name
  const handleFolderSelect = () => {
    setUploadType('folder');
    if (folderInputRef.current) {
      folderInputRef.current.click();
    }
  };

  // Handle batch name confirmation for file uploads
  const handleBatchNameConfirm = () => {
    if (!batchName.trim()) {
      message.error('Batch name cannot be empty');
      return;
    }
    setBatchNameModalVisible(false);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Load recent images for this project
  const loadRecentImages = async () => {
    try {
      const response = await fetch(`/api/v1/projects/${projectId}/images?limit=12`);
      if (response.ok) {
        const data = await response.json();
        setRecentImages(data.images || []);
      }
    } catch (error) {
      console.error('Failed to load recent images:', error);
    }
  };

  // Load recent images when component mounts
  useEffect(() => {
    if (projectId) {
      loadRecentImages();
    }
  }, [projectId]);

  // Load management data
  const loadManagementData = async () => {
    setLoadingManagement(true);
    try {
      const data = await projectsAPI.getProjectManagementData(projectId);
      setManagementData(data);
    } catch (error) {
      const errorInfo = handleAPIError(error);
      message.error(`Failed to load management data: ${errorInfo.message}`);
      console.error('Load management data error:', error);
    } finally {
      setLoadingManagement(false);
    }
  };

  // Load management data when component mounts and when switching to management tab
  useEffect(() => {
    if (projectId) {
      loadManagementData();
    }
  }, [projectId]);

  // Load available datasets when management data changes
  useEffect(() => {
    if (managementData) {
      loadAvailableDatasets();
    }
  }, [managementData]);

  // Dataset management functions
  const handleAssignToAnnotating = async (dataset) => {
    try {
      await projectsAPI.assignDatasetToAnnotating(projectId, dataset.id);
      message.success(`Dataset "${dataset.name}" assigned to annotating`);
      // Reload management data to reflect changes
      loadManagementData();
    } catch (error) {
      const errorInfo = handleAPIError(error);
      message.error(`Failed to assign dataset: ${errorInfo.message}`);
      console.error('Assign dataset error:', error);
    }
  };

  const handleRenameDataset = (dataset) => {
    setRenamingDataset(dataset);
    setNewDatasetName(dataset.name);
    setRenameModalVisible(true);
  };

  const handleRenameConfirm = async () => {
    if (!newDatasetName.trim()) {
      message.error('Dataset name cannot be empty');
      return;
    }

    try {
      await projectsAPI.renameDataset(projectId, renamingDataset.id, newDatasetName.trim());
      message.success(`Dataset renamed to "${newDatasetName}"`);
      setRenameModalVisible(false);
      setRenamingDataset(null);
      setNewDatasetName('');
      // Reload management data to reflect changes
      loadManagementData();
    } catch (error) {
      const errorInfo = handleAPIError(error);
      message.error(`Failed to rename dataset: ${errorInfo.message}`);
      console.error('Rename dataset error:', error);
    }
  };

  const handleDeleteDataset = async (dataset = null) => {
    // If no dataset provided, delete all project data
    const title = dataset ? 'Delete Dataset' : 'Delete All Project Data';
    const content = dataset 
      ? `Are you sure you want to delete "${dataset.name}"? This action cannot be undone.`
      : `Are you sure you want to delete all images and data for this project? This action cannot be undone.`;
    
    Modal.confirm({
      title,
      content,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          if (dataset) {
            await projectsAPI.deleteProjectDataset(projectId, dataset.id);
            message.success(`Dataset "${dataset.name}" deleted successfully`);
          } else {
            // Delete all project data
            const response = await fetch(`/api/v1/projects/${projectId}/clear-data`, {
              method: 'DELETE',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
              }
            });
            
            if (response.ok) {
              message.success('All project data deleted successfully');
              // Reload project data to reflect changes
              loadProject();
            } else {
              const errorData = await response.json();
              throw new Error(errorData.detail || 'Failed to delete project data');
            }
          }
          // Reload management data to reflect changes
          loadManagementData();
        } catch (error) {
          const errorInfo = handleAPIError(error);
          message.error(`Failed to delete: ${errorInfo.message}`);
          console.error('Delete error:', error);
        }
      }
    });
  };

  const handleStartAnnotating = (dataset) => {
    // Navigate to annotation launcher for this specific dataset
    message.info(`Starting annotation for "${dataset.name}"`);
    navigate(`/annotate-launcher/${dataset.id}`);
  };

  const handleMoveToUnassigned = async (dataset) => {
    try {
      await projectsAPI.moveDatasetToUnassigned(projectId, dataset.id);
      message.success(`Dataset "${dataset.name}" moved to unassigned`);
      loadManagementData();
    } catch (error) {
      const errorInfo = handleAPIError(error);
      message.error(`Failed to move dataset: ${errorInfo.message}`);
      console.error('Move to unassigned error:', error);
    }
  };

  const handleMoveToDataset = async (dataset) => {
    try {
      await projectsAPI.moveDatasetToCompleted(projectId, dataset.id);
      message.success(`Dataset "${dataset.name}" moved to dataset section`);
      loadManagementData();
    } catch (error) {
      const errorInfo = handleAPIError(error);
      message.error(`Failed to move dataset: ${errorInfo.message}`);
      console.error('Move to dataset error:', error);
    }
  };

  const handleMoveToAnnotating = async (dataset) => {
    try {
      await projectsAPI.assignDatasetToAnnotating(projectId, dataset.id);
      message.success(`Dataset "${dataset.name}" moved to annotating section`);
      loadManagementData();
    } catch (error) {
      const errorInfo = handleAPIError(error);
      message.error(`Failed to move dataset: ${errorInfo.message}`);
      console.error('Move to annotating error:', error);
    }
  };

  // Upload a single file
  const uploadFile = async (file, batchNameToUse) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('batch_name', batchNameToUse);
      if (tags.length > 0) {
        formData.append('tags', JSON.stringify(tags));
      }

      const response = await fetch(`/api/v1/projects/${projectId}/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        message.success(`${file.name} uploaded successfully to "${batchNameToUse}"!`);
        return result;
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Upload failed: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      message.error(`Failed to upload ${file.name}: ${error.message}`);
      throw error;
    }
  };

  // Upload multiple files in bulk
  const uploadMultipleFiles = async (files, batchNameToUse) => {
    try {
      const formData = new FormData();
      
      // Add all files to FormData
      files.forEach(file => {
        formData.append('files', file);
      });
      
      formData.append('batch_name', batchNameToUse);
      if (tags.length > 0) {
        formData.append('tags', JSON.stringify(tags));
      }

      const response = await fetch(`/api/v1/projects/${projectId}/upload-bulk`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        const successCount = result.results?.successful_uploads || 0;
        const totalCount = result.results?.total_files || files.length;
        
        if (successCount === totalCount) {
          message.success(`All ${successCount} files uploaded successfully to "${batchNameToUse}"!`);
        } else {
          message.warning(`${successCount} of ${totalCount} files uploaded successfully to "${batchNameToUse}"`);
          if (result.results?.errors?.length > 0) {
            result.results.errors.forEach(error => {
              message.error(error);
            });
          }
        }
        return result;
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Upload failed: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Bulk upload error:', error);
      message.error(`Failed to upload files: ${error.message}`);
      throw error;
    }
  };

  // State to collect files for bulk upload
  const [uploadTimeout, setUploadTimeout] = useState(null);

  // Upload configuration
  const uploadProps = {
    name: 'files',
    multiple: true,
    customRequest: async ({ file, onSuccess, onError, onProgress }) => {
      // Add file to pending list and delay upload to collect multiple files
      setPendingFiles(prev => {
        const newFiles = [...prev, { file, onSuccess, onError, onProgress }];
        
        // Clear existing timeout
        if (uploadTimeout) {
          clearTimeout(uploadTimeout);
        }
        
        // Set new timeout to upload after 500ms of no new files
        const newTimeout = setTimeout(async () => {
          try {
            setUploading(true);
            setUploadProgress(0);
            
            // Use current batch name or default
            const batchNameToUse = batchName || `Uploaded on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`;

            // Simulate progress for better UX
            const progressInterval = setInterval(() => {
              setUploadProgress(prev => Math.min(prev + 10, 90));
            }, 100);

            // Extract just the files for upload
            const filesToUpload = newFiles.map(item => item.file);
            const result = await uploadMultipleFiles(filesToUpload, batchNameToUse);

            clearInterval(progressInterval);
            setUploadProgress(100);

            // Call success for all files
            newFiles.forEach(item => {
              item.onSuccess(result);
            });
            
            setUploadedFiles(prev => [...prev, ...newFiles.map(item => ({ ...result, file: item.file }))]);
            
            // Reload recent images and project stats
            loadRecentImages();
            loadProject();
            loadManagementData(); // Reload to update datasets list
            
            // Clear pending files
            setPendingFiles([]);
          } catch (error) {
            // Call error for all files
            newFiles.forEach(item => {
              item.onError(error);
            });
          } finally {
            setUploading(false);
            setUploadProgress(0);
          }
        }, 500);
        
        setUploadTimeout(newTimeout);
        return newFiles;
      });
    },
    accept: '.jpg,.jpeg,.png,.bmp,.webp,.avif',
    beforeUpload: (file) => {
      const isImage = file.type.startsWith('image/');
      if (!isImage) {
        message.error(`${file.name} is not an image file`);
        return false;
      }
      
      const isLt20M = file.size / 1024 / 1024 < 20;
      if (!isLt20M) {
        message.error(`${file.name} must be smaller than 20MB!`);
        return false;
      }
      
      return true;
    },
    showUploadList: {
      showPreviewIcon: true,
      showRemoveIcon: true,
      showDownloadIcon: false,
    },
  };

  // Sidebar menu items
  const menuItems = [
    {
      key: 'data',
      label: 'DATA',
      type: 'group',
      children: [
        {
          key: 'upload',
          icon: <UploadOutlined />,
          label: 'Upload Data',
        },
        {
          key: 'management',
          icon: <TagOutlined />,
          label: 'Management',
        },
        {
          key: 'dataset',
          icon: <DatabaseOutlined />,
          label: 'Dataset',
        },
        {
          key: 'versions',
          icon: <HistoryOutlined />,
          label: 'Versions',
        },
      ],
    },
    {
      key: 'models',
      label: 'MODELS',
      type: 'group',
      children: [
        {
          key: 'models',
          icon: <RobotOutlined />,
          label: 'Models',
        },
        {
          key: 'visualize',
          icon: <EyeOutlined />,
          label: 'Visualize',
        },
      ],
    },
    {
      key: 'deploy',
      label: 'DEPLOY',
      type: 'group',
      children: [
        {
          key: 'deployments',
          icon: <DeploymentUnitOutlined />,
          label: 'Deployments',
        },
        {
          key: 'active-learning',
          icon: <BulbOutlined />,
          label: 'Active Learning',
        },
      ],
    },
  ];

  // Render content based on selected menu item
  const renderContent = () => {
    switch (selectedKey) {
      case 'upload':
        return renderUploadContent();
      case 'management':
        return renderManagementContent();
      case 'dataset':
        return renderDatasetContent();
      case 'versions':
        return renderVersionsContent();
      case 'models':
        return renderModelsContent();
      case 'visualize':
        return renderVisualizeContent();
      case 'deployments':
        return renderDeploymentsContent();
      case 'active-learning':
        return renderActiveLearningContent();
      default:
        return renderUploadContent();
    }
  };

  const renderUploadContent = () => (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ margin: 0, marginBottom: '8px' }}>
          <UploadOutlined style={{ marginRight: '8px' }} />
          Upload
        </Title>
      </div>

      <Card style={{ marginBottom: '24px' }}>
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <div style={{ marginBottom: '16px' }}>
              <Text strong>Batch Name:</Text>
            </div>
            <Input 
              placeholder={`Uploaded on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`}
              value={batchName}
              onChange={(e) => {
                setBatchName(e.target.value);
                // Clear tags when batch name is entered
                if (e.target.value.trim() && tags.length > 0) {
                  setTags([]);
                }
              }}
              disabled={tags.length > 0}
              style={{ 
                marginBottom: '16px',
                opacity: tags.length > 0 ? 0.6 : 1
              }}
            />
          </Col>
          <Col span={12}>
            <div style={{ marginBottom: '16px' }}>
              <Text strong>Tags:</Text>
              <Text type="secondary" style={{ marginLeft: '8px' }}>
                <SettingOutlined />
              </Text>
            </div>
            <Select
              mode="multiple"
              style={{ 
                width: '100%',
                opacity: batchName.trim() ? 0.6 : 1
              }}
              placeholder="Select existing dataset or leave empty for new batch..."
              value={tags}
              onChange={(selectedTags) => {
                setTags(selectedTags);
                // Clear batch name when tags are selected
                if (selectedTags.length > 0 && batchName.trim()) {
                  setBatchName('');
                }
              }}
              options={availableDatasets}
              allowClear
              disabled={batchName.trim() !== ''}
            />
          </Col>
        </Row>
      </Card>

      <Card>
        <Dragger {...uploadProps} style={{ marginBottom: '16px' }}>
          <p className="ant-upload-drag-icon">
            <InboxOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
          </p>
          <p className="ant-upload-text" style={{ fontSize: '18px', fontWeight: 500 }}>
            Drag and drop file(s) to upload, or:
          </p>
        </Dragger>
        
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <Button 
            type="primary" 
            icon={<FolderOutlined />} 
            style={{ marginRight: '8px' }}
            onClick={(e) => {
              e.stopPropagation();
              handleFileSelect();
            }}
          >
            Select File(s)
          </Button>
          <Button 
            icon={<FolderOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              handleFolderSelect();
            }}
          >
            Select Folder
          </Button>
          
          {/* Hidden file inputs */}
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            multiple
            accept=".jpg,.jpeg,.png,.bmp,.webp,.avif"
            onChange={async (e) => {
              const files = Array.from(e.target.files);
              if (files.length === 0) return;

              setUploading(true);
              const batchNameToUse = batchName || `Uploaded on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`;
              
              try {
                for (const file of files) {
                  await uploadFile(file, batchNameToUse);
                }
                
                // Reload data after all uploads
                loadProject();
                loadRecentImages();
                loadManagementData();
                message.success(`${files.length} file(s) uploaded successfully to "${batchNameToUse}"!`);
              } catch (error) {
                console.error('Batch upload error:', error);
              } finally {
                setUploading(false);
                // Clear the input value to allow re-uploading the same file
                e.target.value = '';
              }
            }}
          />
          <input
            type="file"
            ref={folderInputRef}
            style={{ display: 'none' }}
            webkitdirectory=""
            multiple
            accept=".jpg,.jpeg,.png,.bmp,.webp,.avif"
            onChange={async (e) => {
              const files = Array.from(e.target.files);
              if (files.length === 0) return;

              // Extract folder name from the first file's path
              const firstFile = files[0];
              const pathParts = firstFile.webkitRelativePath.split('/');
              const folderName = pathParts[0] || `Folder_${new Date().toLocaleDateString()}`;
              
              setUploading(true);
              
              try {
                for (const file of files) {
                  await uploadFile(file, folderName);
                }
                
                // Reload data after all uploads
                loadProject();
                loadRecentImages();
                loadManagementData();
                message.success(`${files.length} file(s) uploaded successfully to "${folderName}"!`);
              } catch (error) {
                console.error('Folder upload error:', error);
              } finally {
                setUploading(false);
                // Clear the input value to allow re-uploading the same folder
                e.target.value = '';
              }
            }}
          />
        </div>

        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <Title level={4} style={{ color: '#666' }}>Supported Formats</Title>
          <Row gutter={[24, 16]} justify="center">
            <Col>
              <div style={{ textAlign: 'center' }}>
                <PictureOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
                <div style={{ marginTop: '8px' }}>
                  <Text strong>Images</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    .jpg, .png, .bmp, .webp, .avif
                  </Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: '11px' }}>
                    in 26 formats
                  </Text>
                </div>
              </div>
            </Col>
            <Col>
              <div style={{ textAlign: 'center' }}>
                <TagOutlined style={{ fontSize: '24px', color: '#52c41a' }} />
                <div style={{ marginTop: '8px' }}>
                  <Text strong>Annotations</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    .mov, .mp4
                  </Text>
                </div>
              </div>
            </Col>
            <Col>
              <div style={{ textAlign: 'center' }}>
                <PictureOutlined style={{ fontSize: '24px', color: '#722ed1' }} />
                <div style={{ marginTop: '8px' }}>
                  <Text strong>Videos</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    .pdf
                  </Text>
                </div>
              </div>
            </Col>
            <Col>
              <div style={{ textAlign: 'center' }}>
                <DatabaseOutlined style={{ fontSize: '24px', color: '#fa8c16' }} />
                <div style={{ marginTop: '8px' }}>
                  <Text strong>PDFs</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    .pdf
                  </Text>
                </div>
              </div>
            </Col>
          </Row>
          <Text type="secondary" style={{ fontSize: '11px' }}>
            (Max size of 20MB and 16,000 pixels).
          </Text>
        </div>

        <Divider />

        <div style={{ marginBottom: '24px' }}>
          <Title level={5}>Need images to get started? We've got you covered.</Title>
          
          <Card size="small" style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <DatabaseOutlined style={{ fontSize: '20px', color: '#722ed1', marginRight: '12px' }} />
              <div style={{ flex: 1 }}>
                <Text strong>Search on Roboflow Universe: World's Largest Platform for Computer Vision Data</Text>
              </div>
            </div>
            <Input 
              placeholder="Search images and annotations from 600k datasets and 400 million images (e.g. cars, people)"
              suffix={<Button type="primary" size="small">→</Button>}
              style={{ marginTop: '12px' }}
            />
          </Card>

          <Card size="small" style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <YoutubeOutlined style={{ fontSize: '20px', color: '#ff4d4f', marginRight: '12px' }} />
              <div style={{ flex: 1 }}>
                <Text strong>Import YouTube Video</Text>
              </div>
            </div>
            <Input 
              placeholder="e.g. https://www.youtube.com/watch?v=dQw4w9WgXcQ"
              suffix={<Button type="primary" size="small">→</Button>}
              style={{ marginTop: '12px' }}
            />
          </Card>

          <Row gutter={16}>
            <Col span={12}>
              <Card size="small">
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <ApiOutlined style={{ fontSize: '20px', color: '#1890ff', marginRight: '12px' }} />
                  <Text strong>Collect Images via the Upload API</Text>
                </div>
              </Card>
            </Col>
            <Col span={12}>
              <Card size="small">
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <CloudOutlined style={{ fontSize: '20px', color: '#52c41a', marginRight: '12px' }} />
                  <Text strong>Import From Cloud Providers</Text>
                </div>
              </Card>
            </Col>
          </Row>
        </div>
      </Card>

      {/* Upload Progress and Results */}
      {(uploading || uploadedFiles.length > 0) && (
        <Card title="Upload Status" style={{ marginTop: '24px' }}>
          {uploading && (
            <div style={{ marginBottom: '16px' }}>
              <Text>Uploading files...</Text>
              <Progress percent={uploadProgress} status="active" />
            </div>
          )}
          
          {uploadedFiles.length > 0 && (
            <div>
              <Title level={5}>Recently Uploaded ({uploadedFiles.length} files)</Title>
              <Row gutter={[16, 16]}>
                {uploadedFiles.slice(-6).map((fileInfo, index) => (
                  <Col span={4} key={index}>
                    <Card
                      size="small"
                      cover={
                        <div style={{ 
                          height: '80px', 
                          background: '#f5f5f5', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center' 
                        }}>
                          <PictureOutlined style={{ fontSize: '24px', color: '#999' }} />
                        </div>
                      }
                    >
                      <Card.Meta 
                        title={
                          <Text ellipsis style={{ fontSize: '12px' }}>
                            {fileInfo.file?.name || 'Unknown'}
                          </Text>
                        }
                        description={
                          <Text type="secondary" style={{ fontSize: '11px' }}>
                            {fileInfo.file?.size ? `${(fileInfo.file.size / 1024).toFixed(1)} KB` : ''}
                          </Text>
                        }
                      />
                    </Card>
                  </Col>
                ))}
              </Row>
              
              {uploadedFiles.length > 6 && (
                <div style={{ textAlign: 'center', marginTop: '16px' }}>
                  <Button type="link">
                    View all {uploadedFiles.length} uploaded files
                  </Button>
                </div>
              )}
            </div>
          )}
        </Card>
      )}
    </div>
  );

  // Render dataset card
  const renderDatasetCard = (dataset, status) => {
    const getStatusIcon = () => {
      switch (status) {
        case 'unassigned': return <ClockCircleOutlined style={{ color: '#faad14' }} />;
        case 'annotating': return <PlayCircleOutlined style={{ color: '#1890ff' }} />;
        case 'completed': return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
        default: return <DatabaseOutlined />;
      }
    };

    const getProgressPercent = () => {
      if (dataset.total_images === 0) return 0;
      return Math.round((dataset.labeled_images / dataset.total_images) * 100);
    };

    // Dropdown menu items for three dots - different based on status
    const getMenuItems = () => {
      const baseItems = [
        {
          key: 'rename',
          label: 'Rename',
          icon: <EditOutlined />,
          onClick: () => handleRenameDataset(dataset)
        }
      ];

      if (status === 'annotating') {
        baseItems.push(
          {
            key: 'move-to-unassigned',
            label: 'Move to Unassigned',
            icon: <ClockCircleOutlined />,
            onClick: () => handleMoveToUnassigned(dataset)
          },
          {
            key: 'move-to-dataset',
            label: 'Move to Dataset',
            icon: <CheckCircleOutlined />,
            onClick: () => handleMoveToDataset(dataset)
          }
        );
      } else if (status === 'completed') {
        baseItems.push(
          {
            key: 'move-to-unassigned',
            label: 'Move to Unassigned',
            icon: <ClockCircleOutlined />,
            onClick: () => handleMoveToUnassigned(dataset)
          },
          {
            key: 'move-to-annotating',
            label: 'Move to Annotating',
            icon: <PlayCircleOutlined />,
            onClick: () => handleMoveToAnnotating(dataset)
          }
        );
      }

      baseItems.push({
        key: 'delete',
        label: 'Delete',
        icon: <DeleteOutlined />,
        danger: true,
        onClick: () => handleDeleteDataset(dataset)
      });

      return baseItems;
    };

    const menuItems = getMenuItems();

    return (
      <Card
        key={dataset.id}
        size="small"
        style={{ 
          marginBottom: '12px',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          border: '1px solid #f0f0f0',
          position: 'relative'
        }}
        hoverable
        bodyStyle={{ padding: '12px' }}
        onClick={() => {
          if (status === 'annotating') {
            // Navigate to annotation page
            message.info(`Opening annotation for ${dataset.name}`);
          }
        }}
      >
        {/* Three dots button in top right corner */}
        <div style={{ 
          position: 'absolute', 
          top: '8px', 
          right: '8px', 
          zIndex: 10 
        }}>
          <Dropdown
            menu={{ items: menuItems }}
            trigger={['click']}
            placement="bottomRight"
          >
            <Button 
              type="text" 
              icon={<MoreOutlined />} 
              size="small"
              onClick={(e) => {
                e.stopPropagation();
              }}
              style={{ 
                border: 'none',
                boxShadow: 'none',
                padding: '4px'
              }}
            />
          </Dropdown>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px', paddingRight: '24px' }}>
          {getStatusIcon()}
          <Text strong style={{ marginLeft: '8px', fontSize: '14px' }}>
            {dataset.name}
          </Text>
        </div>
        
        <div style={{ marginBottom: '8px' }}>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {dataset.total_images} images
          </Text>
          {status === 'annotating' && (
            <div style={{ marginTop: '4px' }}>
              <Progress 
                percent={getProgressPercent()} 
                size="small" 
                status={getProgressPercent() === 100 ? 'success' : 'active'}
              />
              <Text type="secondary" style={{ fontSize: '11px' }}>
                {dataset.labeled_images}/{dataset.total_images} labeled
              </Text>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text type="secondary" style={{ fontSize: '11px' }}>
            {new Date(dataset.created_at).toLocaleDateString()}
          </Text>
          {status === 'unassigned' && (
            <Button 
              type="primary" 
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleAssignToAnnotating(dataset);
              }}
            >
              Assign to Annotating
            </Button>
          )}
          {status === 'annotating' && (
            <Button 
              type="primary" 
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleStartAnnotating(dataset);
              }}
            >
              Start Annotating
            </Button>
          )}
        </div>
      </Card>
    );
  };

  const renderManagementContent = () => {
    if (loadingManagement) {
      return (
        <div style={{ padding: '24px', textAlign: 'center' }}>
          <Spin size="large" />
          <div style={{ marginTop: '16px' }}>
            <Text>Loading management data...</Text>
          </div>
        </div>
      );
    }

    return (
      <div style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <Title level={2} style={{ margin: 0, marginBottom: '8px' }}>
              <TagOutlined style={{ marginRight: '8px' }} />
              Management
            </Title>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <Text type="secondary">Sort By:</Text>
              <Select defaultValue="newest" style={{ width: 120 }}>
                <Select.Option value="newest">Newest</Select.Option>
                <Select.Option value="oldest">Oldest</Select.Option>
                <Select.Option value="name">Name</Select.Option>
              </Select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <Button type="primary" icon={<PlusOutlined />}>
              New Version
            </Button>
          </div>
        </div>

        <Row gutter={[24, 24]}>
          {/* Unassigned Section */}
          <Col span={8}>
            <Card 
              title={
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text strong>Unassigned</Text>
                  <Text type="secondary">{managementData?.unassigned?.count || 0} Datasets</Text>
                </div>
              }
              style={{ height: '500px', overflow: 'auto' }}
            >
              <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                <Button type="link" icon={<UploadOutlined />} onClick={() => setSelectedKey('upload')}>
                  Upload More Images
                </Button>
              </div>
              
              {managementData?.unassigned?.datasets?.length > 0 ? (
                managementData.unassigned.datasets.map(dataset => 
                  renderDatasetCard(dataset, 'unassigned')
                )
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <Text type="secondary">No unassigned datasets found.</Text>
                </div>
              )}
            </Card>
          </Col>

          {/* Annotating Section */}
          <Col span={8}>
            <Card 
              title={
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text strong>Annotating</Text>
                  <Text type="secondary">{managementData?.annotating?.count || 0} Datasets</Text>
                </div>
              }
              style={{ height: '500px', overflow: 'auto' }}
            >
              {managementData?.annotating?.datasets?.length > 0 ? (
                managementData.annotating.datasets.map(dataset => 
                  renderDatasetCard(dataset, 'annotating')
                )
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <Text type="secondary">Upload and assign images to an annotator.</Text>
                </div>
              )}
            </Card>
          </Col>

          {/* Dataset Section */}
          <Col span={8}>
            <Card 
              title={
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text strong>Dataset</Text>
                  <Text type="secondary">{managementData?.dataset?.count || 0} Datasets</Text>
                </div>
              }
              style={{ height: '500px', overflow: 'auto' }}
            >
              <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                <Button type="link" icon={<EyeOutlined />}>
                  See all {project?.image_count || 0} images
                </Button>
              </div>

              {managementData?.dataset?.datasets?.length > 0 ? (
                managementData.dataset.datasets.map(dataset => 
                  renderDatasetCard(dataset, 'completed')
                )
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <Text type="secondary">No completed datasets found.</Text>
                </div>
              )}
            </Card>
          </Col>
        </Row>
      </div>
    );
  };

  const renderDatasetContent = () => (
    <div style={{ padding: '24px' }}>
      <Title level={2}>
        <DatabaseOutlined style={{ marginRight: '8px' }} />
        Dataset Management
      </Title>
      
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Total Images"
              value={project?.total_images || 0}
              prefix={<PictureOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Labeled Images"
              value={project?.labeled_images || 0}
              prefix={<TagOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Progress"
              value={project?.total_images > 0 ? Math.round((project?.labeled_images || 0) / project.total_images * 100) : 0}
              suffix="%"
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Card title="Upload New Images" style={{ marginBottom: '24px' }}>
        <Upload.Dragger
          name="file"
          multiple
          accept="image/*,.jpg,.jpeg,.png,.gif,.bmp,.webp"
          directory={false}
          showUploadList={true}
          action={`http://localhost:12000/api/v1/projects/${projectId}/upload`}
          headers={{
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
          }}
          onChange={(info) => {
            const { status } = info.file;
            if (status !== 'uploading') {
              console.log(info.file, info.fileList);
            }
            if (status === 'done') {
              message.success(`${info.file.name} uploaded successfully.`);
              // Reload project data to update statistics
              loadProject();
            } else if (status === 'error') {
              message.error(`${info.file.name} upload failed.`);
            }
          }}
          onDrop={(e) => {
            console.log('Dropped files', e.dataTransfer.files);
          }}
        >
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">Click or drag images to upload</p>
          <p className="ant-upload-hint">
            Support for single or bulk upload. Accepts JPG, PNG, GIF, BMP, WebP formats.
          </p>
        </Upload.Dragger>
        
        <div style={{ marginTop: '16px' }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12}>
              <Upload
                name="file"
                multiple
                accept="image/*"
                showUploadList={false}
                action={`http://localhost:12000/api/v1/projects/${projectId}/upload`}
                headers={{
                  'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
                }}
                onChange={(info) => {
                  if (info.file.status === 'done') {
                    message.success(`${info.file.name} uploaded successfully.`);
                    loadProject();
                  } else if (info.file.status === 'error') {
                    message.error(`${info.file.name} upload failed.`);
                  }
                }}
              >
                <Button type="primary" icon={<UploadOutlined />} block>
                  Select Files
                </Button>
              </Upload>
            </Col>
            <Col xs={24} sm={12}>
              <Upload
                name="file"
                multiple
                directory
                accept="image/*"
                showUploadList={false}
                action={`http://localhost:12000/api/v1/projects/${projectId}/upload`}
                headers={{
                  'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
                }}
                onChange={(info) => {
                  if (info.file.status === 'done') {
                    message.success(`${info.file.name} uploaded successfully.`);
                    loadProject();
                  } else if (info.file.status === 'error') {
                    message.error(`${info.file.name} upload failed.`);
                  }
                }}
              >
                <Button icon={<FolderOutlined />} block>
                  Select Folder
                </Button>
              </Upload>
            </Col>
          </Row>
        </div>
      </Card>

      <Card title="Dataset Actions">
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <Button 
              type="primary" 
              icon={<TagOutlined />}
              block
              onClick={() => {
                // Navigate to annotation launcher - need a dataset ID
                // For now, show message to select a dataset first
                message.info('Please select a dataset from the Annotating section to start annotation');
              }}
            >
              Start Annotating
            </Button>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Button 
              icon={<ExportOutlined />}
              block
            >
              Export Dataset
            </Button>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Button 
              icon={<EyeOutlined />}
              block
            >
              View Images
            </Button>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Dropdown
              menu={{
                items: [
                  {
                    key: 'view-settings',
                    icon: <SettingOutlined />,
                    label: 'Dataset Settings',
                  },
                  {
                    key: 'delete-dataset',
                    icon: <DeleteOutlined />,
                    label: 'Delete Dataset',
                    danger: true,
                  },
                ]
              }}
              onMenuClick={({ key }) => {
                if (key === 'delete-dataset') {
                  handleDeleteDataset();
                } else if (key === 'view-settings') {
                  // Handle dataset settings view
                  message.info('Dataset settings coming soon!');
                }
              }}
            >
              <Button 
                icon={<SettingOutlined />}
                block
              >
                Dataset Settings
              </Button>
            </Dropdown>
          </Col>
        </Row>
      </Card>
    </div>
  );

  const renderVersionsContent = () => (
    <div style={{ padding: '24px' }}>
      <Title level={2}>
        <HistoryOutlined style={{ marginRight: '8px' }} />
        Versions
      </Title>
      <Alert
        message="Dataset Versions"
        description="Track different versions of your dataset."
        type="info"
        showIcon
      />
    </div>
  );

  const renderModelsContent = () => (
    <div style={{ padding: '24px' }}>
      <Title level={2}>
        <RobotOutlined style={{ marginRight: '8px' }} />
        Models
      </Title>
      <Alert
        message="Model Training"
        description="Train and manage your computer vision models."
        type="info"
        showIcon
        style={{ marginBottom: '24px' }}
      />
      <Button 
        type="primary" 
        size="large"
        onClick={() => navigate('/models')}
      >
        View Models
      </Button>
    </div>
  );

  const renderVisualizeContent = () => (
    <div style={{ padding: '24px' }}>
      <Title level={2}>
        <EyeOutlined style={{ marginRight: '8px' }} />
        Visualize
      </Title>
      <Alert
        message="Data Visualization"
        description="Visualize your dataset and model performance."
        type="info"
        showIcon
      />
    </div>
  );

  const renderDeploymentsContent = () => (
    <div style={{ padding: '24px' }}>
      <Title level={2}>
        <DeploymentUnitOutlined style={{ marginRight: '8px' }} />
        Deployments
      </Title>
      <Alert
        message="Model Deployment"
        description="Deploy your trained models to production."
        type="info"
        showIcon
      />
    </div>
  );

  const renderActiveLearningContent = () => (
    <div style={{ padding: '24px' }}>
      <Title level={2}>
        <BulbOutlined style={{ marginRight: '8px' }} />
        Active Learning
      </Title>
      <Alert
        message="Active Learning"
        description="Improve your model with active learning techniques."
        type="info"
        showIcon
        style={{ marginBottom: '24px' }}
      />
      <Button 
        type="primary" 
        size="large"
        onClick={() => navigate('/active-learning')}
      >
        Start Active Learning
      </Button>
    </div>
  );

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>
          <Text>Loading project workspace...</Text>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <Alert
        message="Project Not Found"
        description="The requested project could not be found."
        type="error"
        showIcon
        action={
          <Button onClick={() => navigate('/projects')}>
            Back to Projects
          </Button>
        }
      />
    );
  }

  const typeInfo = getProjectTypeInfo(project.project_type);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* Project Sidebar */}
      <Sider 
        width={280} 
        style={{ 
          background: '#fff',
          borderRight: '1px solid #f0f0f0',
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          zIndex: 100
        }}
      >
        {/* Back Button */}
        <div style={{ padding: '16px', borderBottom: '1px solid #f0f0f0' }}>
          <Button 
            type="text" 
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/projects')}
            style={{ marginBottom: '16px' }}
          >
            Back to Projects
          </Button>
          
          {/* Project Header */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                background: `linear-gradient(135deg, ${
                  typeInfo.color === 'blue' ? '#1890ff, #40a9ff' : 
                  typeInfo.color === 'green' ? '#52c41a, #73d13d' : 
                  typeInfo.color === 'purple' ? '#722ed1, #9254de' : '#d9d9d9, #f0f0f0'
                })`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '18px',
                marginRight: '12px'
              }}>
                {typeInfo.color === 'blue' ? '🎯' : 
                 typeInfo.color === 'green' ? '🏷️' : 
                 typeInfo.color === 'purple' ? '✂️' : '📁'}
              </div>
              <div>
                <Title level={4} style={{ margin: 0, fontSize: '16px' }}>
                  {project.name}
                </Title>
                <Tag color={typeInfo.color} size="small">
                  {typeInfo.label}
                </Tag>
              </div>
            </div>
          </div>

          {/* Project Stats */}
          <Row gutter={[8, 8]}>
            <Col span={12}>
              <Statistic
                title="Images"
                value={project.total_images}
                prefix={<PictureOutlined />}
                valueStyle={{ fontSize: '14px' }}
              />
            </Col>
            <Col span={12}>
              <Statistic
                title="Datasets"
                value={project.total_datasets}
                prefix={<DatabaseOutlined />}
                valueStyle={{ fontSize: '14px' }}
              />
            </Col>
          </Row>
          
          <div style={{ marginTop: '12px' }}>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              Progress: {project.total_images > 0 
                ? Math.round((project.labeled_images / project.total_images) * 100) 
                : 0}% annotated
            </Text>
            <Progress 
              percent={project.total_images > 0 
                ? Math.round((project.labeled_images / project.total_images) * 100) 
                : 0} 
              size="small" 
              style={{ marginTop: '4px' }}
            />
          </div>
        </div>

        {/* Navigation Menu */}
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          style={{ border: 'none', background: 'transparent' }}
          items={menuItems}
          onClick={({ key }) => setSelectedKey(key)}
        />
      </Sider>

      {/* Main Content */}
      <Layout style={{ marginLeft: 280 }}>
        <Content style={{ background: '#f5f5f5', minHeight: '100vh' }}>
          {renderContent()}
        </Content>
      </Layout>

      {/* Rename Dataset Modal */}
      <Modal
        title="Rename Dataset"
        open={renameModalVisible}
        onOk={handleRenameConfirm}
        onCancel={() => {
          setRenameModalVisible(false);
          setRenamingDataset(null);
          setNewDatasetName('');
        }}
        okText="Rename"
        cancelText="Cancel"
      >
        <Input
          placeholder="Enter new dataset name"
          value={newDatasetName}
          onChange={(e) => setNewDatasetName(e.target.value)}
          onPressEnter={handleRenameConfirm}
        />
      </Modal>

      {/* Batch Name Modal */}
      <Modal
        title="Enter Batch Name"
        open={batchNameModalVisible}
        onOk={handleBatchNameConfirm}
        onCancel={() => {
          setBatchNameModalVisible(false);
          setBatchName('');
        }}
        okText="Continue"
        cancelText="Cancel"
      >
        <Input
          placeholder="Enter batch name for uploaded files"
          value={batchName}
          onChange={(e) => setBatchName(e.target.value)}
          onPressEnter={handleBatchNameConfirm}
          autoFocus
        />
      </Modal>
    </Layout>
  );
};

export default ProjectWorkspace;