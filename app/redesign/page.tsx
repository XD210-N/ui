"use client";

import { RedesignHome } from "./RedesignHome";
import { RedesignRuntimeBinding } from "./bindings";
import { installBackendModeInterceptor } from "./bindings/backendMode";
import { BackendModeFloating } from "./ui/BackendModeFloating";
import { RedesignGlobalTheme } from "./ui/RedesignGlobalTheme";

// 在任何请求发出前装载「真实/模拟」拦截器（仅客户端，内部有 window 守卫，重复调用安全）。
installBackendModeInterceptor();

export default function RedesignPage() {
  return (
    <>
      <RedesignGlobalTheme />
      {/* 放在 RuntimeBinding(含 ProjectGate) 之外：真实模式连不上后端、主界面被
          「新建项目」弹窗挡住时，这个切换/诊断入口仍然可见可点，不会卡死。 */}
      <BackendModeFloating />
      <RedesignRuntimeBinding>
        <RedesignHome />
      </RedesignRuntimeBinding>
    </>
  );
}
