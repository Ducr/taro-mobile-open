import { useState } from "react";
import Taro, { useLoad } from "@tarojs/taro";
import { View } from "@tarojs/components";
import { Button, Cell, Dialog, Navbar } from "@taroify/core";
import "./index.scss";

const OPENBID_STATUS_TEXT = {
  0: "未开标",
  1: "开标中",
  2: "开标结束",
};
const DECRYPTSTATUS_TEXT = {
  0: "未解密",
  1: "解密完成",
};

export default function Detail() {
  const [isH5] = useState(() => Taro.getEnv() === "WEB");
  const [detailData, setDetailData] = useState({});
  useLoad((option) => {
    const eventChannel = Taro.getCurrentInstance().page.getOpenerEventChannel();
    eventChannel.on("updateProjectData", (data) => {
      setDetailData(data);
    });
    if (!detailData.projectName && decodeURIComponent(option.projectCode)) {
      getProjectDetail(decodeURIComponent(option.projectCode));
    }
  });

  // 获取项目详情
  const getProjectDetail = (projectCode) => {
    Taro.$request({
      url: "/project/detail",
      method: "GET",
      data: {
        projectCode,
      },
    })
      .then((res) => {
        if (res.data?.code === 200) {
          setDetailData(res.data?.data);
        } else {
          Taro.showToast({
            title: res.data?.msg || "业务错误",
            icon: "none",
          });
        }
      });
  };

  // 更新项目
  const onUpdate = (data) => {
    Taro.$request({
      url: "/project/project",
      method: "PUT",
      data: {
        projectCode: detailData.projectCode,
        ...data,
      },
    })
      .then((res) => {
        if (res.data?.code === 200) {
          Taro.showToast({
            title: "操作成功",
            icon: "none",
          });
          getProjectDetail(detailData.projectCode);
        } else {
          Taro.showToast({
            title: res.data?.msg || "业务错误",
            icon: "none",
          });
        }
      });
  };

  // 开始开标
  const onStart = () => {
    Dialog.confirm({
      title: "开始开标",
      message: `确认要对${detailData.projectName}开始开标吗？`,
      onConfirm() {
        onUpdate({ 
          updateKey: "openbidStatus",
          updateValue: 1,
        });
      },
    });
  }

  // 结束开标
  const onFinish = () => {
    Dialog.confirm({
      title: "开始开标",
      message: `确认要对${detailData.projectName}结束开标吗？`,
      onConfirm() {
        onUpdate({ 
          updateKey: "openbidStatus",
          updateValue: 2,
        });
      },
    });
  }
  
  // 开始解密
  const onDecrypt = () => {
    Dialog.confirm({
      title: "开始解密",
      message: `确认要对${detailData.projectName}开始解密吗？`,
      onConfirm() {
        onUpdate({ 
          updateKey: "decryptStatus",
          updateValue: 1,
        });
      },
    });
  };

  const onBack = () => {
    // 当前的页面栈只有1个时，直接 redirectTo 首页
    if (Taro.getCurrentPages().length <= 1) {
      Taro.redirectTo({
        url: "/pages/project/index",
      });
    } else {
      Taro.navigateBack({
        delta: 1,
      });
    }
  };

  return (
    <View className="detail-page" style={!isH5 ? { padding: "10px 0" } : {}}>
      {isH5 && (
        <Navbar title="项目详情">
          <Navbar.NavLeft onClick={onBack}></Navbar.NavLeft>
        </Navbar>
      )}
      <View
        className="detail-container"
        key={detailData.id}
        style={isH5 ? { margin: "10px" } : {}}
      >
        <Cell title="项目名称：">
          <View className="taroify-ellipsis--l2">{detailData.projectName}</View>
        </Cell>
        <Cell title="编号：">
          <View className="taroify-ellipsis--l2">{detailData.projectCode}</View>
        </Cell>
        <Cell title="开标时间：" align="end">{detailData.openbidTime}</Cell>
        <Cell title="类型：" align="end">{detailData.type}</Cell>
        <Cell title="开标状态：" align="end">
          {OPENBID_STATUS_TEXT[detailData.openbidStatus]}
        </Cell>
        <Cell title="解密状态：" align="end">
          {DECRYPTSTATUS_TEXT[detailData.decryptStatus]}
        </Cell>
        <View className="btn-wrapper">
          <Button
            color="primary"
            size="mini"
            disabled={detailData.openbidStatus !== 0}
            onClick={onStart}
          >
            开始开标
          </Button>
          <Button
            color="success"
            size="mini"
            disabled={!(detailData.openbidStatus === 1 && detailData.decryptStatus === 0)}
            onClick={onDecrypt}
          >
            开始解密
          </Button>
          <Button
            color="warning"
            size="mini"
            disabled={!(detailData.openbidStatus === 1 && detailData.decryptStatus === 1)}
            onClick={onFinish}
          >
            结束开标
          </Button>
        </View>
      </View>
    </View>
  );
}
