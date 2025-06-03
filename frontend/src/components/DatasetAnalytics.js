import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';
import {
  Card,
  Row,
  Col,
  Statistic,
  Progress,
  Table,
  Tag,
  Alert,
  Button,
  Spin,
  Typography,
  Divider,
  Space,
  Tooltip,
  Badge
} from 'antd';
import {
  PieChartOutlined,
  BarChartOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { Pie, Bar, Column } from '@ant-design/plots';

const { Title, Text, Paragraph } = Typography;

const DatasetAnalytics = ({ datasetId, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [classDistribution, setClassDistribution] = useState(null);
  const [splitAnalysis, setSplitAnalysis] = useState(null);
  const [imbalanceReport, setImbalanceReport] = useState(null);
  const [labelingProgress, setLabelingProgress] = useState(null);

  useEffect(() => {
    if (datasetId) {
      loadAnalytics();
    }
  }, [datasetId]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      // Load all analytics data
      const [classResp, splitResp, imbalanceResp, progressResp] = await Promise.all([
        fetch(`${API_BASE_URL}/api/analytics/dataset/${datasetId}/class-distribution`),
        fetch(`${API_BASE_URL}/api/analytics/dataset/${datasetId}/split-analysis`),
        fetch(`${API_BASE_URL}/api/analytics/dataset/${datasetId}/imbalance-report`),
        fetch(`${API_BASE_URL}/api/analytics/dataset/${datasetId}/labeling-progress`)
      ]);

      const classData = await classResp.json();
      const splitData = await splitResp.json();
      const imbalanceData = await imbalanceResp.json();
      const progressData = await progressResp.json();

      setClassDistribution(classData);
      setSplitAnalysis(splitData);
      setImbalanceReport(imbalanceData);
      setLabelingProgress(progressData);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderHealthScore = () => {
    if (!imbalanceReport?.overall_health_score) return null;

    const { score, grade, status, issues } = imbalanceReport.overall_health_score;
    
    const getScoreColor = (score) => {
      if (score >= 90) return '#52c41a';
      if (score >= 80) return '#1890ff';
      if (score >= 70) return '#faad14';
      if (score >= 60) return '#fa8c16';
      return '#f5222d';
    };

    return (
      <Card title="Dataset Health Score" size="small">
        <Row gutter={16} align="middle">
          <Col span={8}>
            <Progress
              type="circle"
              percent={score}
              format={() => `${grade}`}
              strokeColor={getScoreColor(score)}
              size={80}
            />
          </Col>
          <Col span={16}>
            <Space direction="vertical" size="small">
              <Text strong style={{ color: getScoreColor(score) }}>
                {status} ({score}/100)
              </Text>
              {issues.length > 0 && (
                <div>
                  <Text type="secondary">Issues:</Text>
                  {issues.map((issue, idx) => (
                    <Tag key={idx} color="orange" style={{ marginTop: 4, display: 'block' }}>
                      {issue}
                    </Tag>
                  ))}
                </div>
              )}
            </Space>
          </Col>
        </Row>
      </Card>
    );
  };

  const renderClassDistribution = () => {
    if (!classDistribution) return null;

    const pieData = Object.entries(classDistribution.class_distribution).map(([className, count]) => ({
      type: className,
      value: count
    }));

    const pieConfig = {
      data: pieData,
      angleField: 'value',
      colorField: 'type',
      radius: 0.8,
      label: {
        type: 'outer',
        content: '{name} ({percentage})'
      },
      interactions: [{ type: 'element-active' }]
    };

    const barData = Object.entries(classDistribution.class_distribution)
      .sort(([,a], [,b]) => b - a)
      .map(([className, count]) => ({
        class: className,
        count: count
      }));

    const barConfig = {
      data: barData,
      xField: 'count',
      yField: 'class',
      seriesField: 'class',
      legend: false,
      meta: {
        class: { alias: 'Class' },
        count: { alias: 'Count' }
      }
    };

    return (
      <Row gutter={16}>
        <Col span={12}>
          <Card title="Class Distribution (Pie Chart)" size="small">
            <Pie {...pieConfig} height={300} />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="Class Distribution (Bar Chart)" size="small">
            <Bar {...barConfig} height={300} />
          </Card>
        </Col>
      </Row>
    );
  };

  const renderImbalanceMetrics = () => {
    if (!classDistribution) return null;

    const getImbalanceColor = (ratio) => {
      if (ratio <= 2) return 'green';
      if (ratio <= 5) return 'orange';
      return 'red';
    };

    const getBalanceIcon = (isBalanced) => {
      return isBalanced ? <CheckCircleOutlined style={{ color: 'green' }} /> : <ExclamationCircleOutlined style={{ color: 'red' }} />;
    };

    return (
      <Card title="Imbalance Metrics" size="small">
        <Row gutter={16}>
          <Col span={6}>
            <Statistic
              title="Total Classes"
              value={classDistribution.num_classes}
              prefix={<PieChartOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Total Annotations"
              value={classDistribution.total_annotations}
              prefix={<BarChartOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Imbalance Ratio"
              value={classDistribution.imbalance_ratio?.toFixed(1)}
              suffix=":1"
              valueStyle={{ color: getImbalanceColor(classDistribution.imbalance_ratio) }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Balanced"
              value={classDistribution.is_balanced ? "Yes" : "No"}
              prefix={getBalanceIcon(classDistribution.is_balanced)}
              valueStyle={{ color: classDistribution.is_balanced ? 'green' : 'red' }}
            />
          </Col>
        </Row>
        
        <Divider />
        
        <Row gutter={16}>
          <Col span={12}>
            <Text strong>Most Common Class:</Text>
            <br />
            <Tag color="blue">
              {classDistribution.most_common_class} ({classDistribution.most_common_count})
            </Tag>
          </Col>
          <Col span={12}>
            <Text strong>Least Common Class:</Text>
            <br />
            <Tag color="red">
              {classDistribution.least_common_class} ({classDistribution.least_common_count})
            </Tag>
          </Col>
        </Row>
      </Card>
    );
  };

  const renderSplitAnalysis = () => {
    if (!splitAnalysis || !labelingProgress) return null;

    const splitData = Object.entries(labelingProgress.split_progress).map(([split, data]) => ({
      split: split.toUpperCase(),
      total: data.total,
      labeled: data.labeled,
      unlabeled: data.unlabeled,
      progress: data.progress_percentage
    }));

    const splitConfig = {
      data: splitData,
      isGroup: true,
      xField: 'split',
      yField: 'total',
      seriesField: 'type',
      dodgePadding: 2,
      intervalPadding: 20,
      label: {
        position: 'middle',
        layout: [
          { type: 'interval-adjust-position' },
          { type: 'interval-hide-overlap' },
          { type: 'adjust-color' }
        ]
      }
    };

    const columns = [
      {
        title: 'Split',
        dataIndex: 'split',
        key: 'split',
        render: (split) => <Tag color="blue">{split}</Tag>
      },
      {
        title: 'Total Images',
        dataIndex: 'total',
        key: 'total'
      },
      {
        title: 'Labeled',
        dataIndex: 'labeled',
        key: 'labeled',
        render: (labeled, record) => (
          <Badge count={labeled} style={{ backgroundColor: '#52c41a' }} />
        )
      },
      {
        title: 'Unlabeled',
        dataIndex: 'unlabeled',
        key: 'unlabeled',
        render: (unlabeled) => (
          <Badge count={unlabeled} style={{ backgroundColor: '#f5222d' }} />
        )
      },
      {
        title: 'Progress',
        dataIndex: 'progress',
        key: 'progress',
        render: (progress) => (
          <Progress percent={progress} size="small" />
        )
      }
    ];

    return (
      <Card title="Train/Val/Test Split Analysis" size="small">
        <Table
          dataSource={splitData}
          columns={columns}
          pagination={false}
          size="small"
          rowKey="split"
        />
      </Card>
    );
  };

  const renderRecommendations = () => {
    if (!imbalanceReport?.recommendations) return null;

    const getRecommendationIcon = (type) => {
      switch (type) {
        case 'critical': return <ExclamationCircleOutlined style={{ color: '#f5222d' }} />;
        case 'warning': return <WarningOutlined style={{ color: '#faad14' }} />;
        case 'info': return <InfoCircleOutlined style={{ color: '#1890ff' }} />;
        default: return <InfoCircleOutlined />;
      }
    };

    const getRecommendationType = (type) => {
      switch (type) {
        case 'critical': return 'error';
        case 'warning': return 'warning';
        case 'info': return 'info';
        default: return 'info';
      }
    };

    return (
      <Card title="Recommendations" size="small">
        <Space direction="vertical" style={{ width: '100%' }}>
          {imbalanceReport.recommendations.map((rec, idx) => (
            <Alert
              key={idx}
              message={
                <Space>
                  {getRecommendationIcon(rec.type)}
                  <Text strong>{rec.title}</Text>
                </Space>
              }
              description={
                <div>
                  <Paragraph>{rec.description}</Paragraph>
                  {rec.actions && (
                    <div>
                      <Text strong>Recommended Actions:</Text>
                      <ul>
                        {rec.actions.map((action, actionIdx) => (
                          <li key={actionIdx}>{action}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              }
              type={getRecommendationType(rec.type)}
              showIcon
            />
          ))}
        </Space>
      </Card>
    );
  };

  if (loading) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>Loading analytics...</div>
        </div>
      </Card>
    );
  }

  return (
    <div style={{ padding: '16px' }}>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={3}>Dataset Analytics</Title>
        <Button onClick={onClose}>Close</Button>
      </div>

      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Health Score */}
        {renderHealthScore()}

        {/* Class Distribution */}
        {renderClassDistribution()}

        {/* Imbalance Metrics */}
        {renderImbalanceMetrics()}

        {/* Split Analysis */}
        {renderSplitAnalysis()}

        {/* Recommendations */}
        {renderRecommendations()}
      </Space>
    </div>
  );
};

export default DatasetAnalytics;