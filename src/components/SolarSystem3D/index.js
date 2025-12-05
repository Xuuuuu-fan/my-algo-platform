import React, { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Html, MeshDistortMaterial, Sphere, Icosahedron, Torus } from '@react-three/drei';
import { useHistory } from '@docusaurus/router';
import * as THREE from 'three';

// --- 1. 数据配置：更紧凑、更大的星系 ---
const PLANETS = [
  // 基础 (内圈 - 岩石行星)
  { id: 'array', title: '数组', path: '/docs/demo', type: 'rocky', color: '#00f2ff', radius: 14, speed: 0.6, size: 1.8 },
  { id: 'linkedlist', title: '链表', path: '/docs/linkedlist', type: 'rocky', color: '#00c3ff', radius: 19, speed: 0.5, size: 2.0 },

  // 核心 (中圈 - 气态/特殊行星)
  { id: 'stack', title: '栈', path: '/docs/stack', type: 'gas', color: '#ff0055', radius: 26, speed: 0.4, size: 2.8 },
  { id: 'queue', title: '队列', path: '/docs/queue', type: 'gas', color: '#ff9900', radius: 34, speed: 0.35, size: 3.0 },

  // 进阶 (外圈 - 巨大行星/环状行星)
  { id: 'tree', title: '树/二叉树', path: '/docs/tree/intro', type: 'earth', color: '#00ff66', radius: 44, speed: 0.25, size: 3.5 },
  { id: 'graph', title: '图论', path: '/docs/graph', type: 'gas', color: '#bd00ff', radius: 56, speed: 0.2, size: 4.0 },

  // 算法 (边缘 - 环状/神秘)
  { id: 'search', title: '查找', path: '/docs/search', type: 'ring', color: '#ffe600', radius: 70, speed: 0.15, size: 3.2 },
  { id: 'sort', title: '排序', path: '/docs/sort', type: 'gas', color: '#ff3366', radius: 85, speed: 0.12, size: 3.8 },
  { id: 'string', title: '字符串', path: '/docs/string', type: 'ring', color: '#ffffff', radius: 100, speed: 0.08, size: 3.5 },
];

// --- 2. 原生粒子爆炸 ---
const NativeExplosion = ({ color, onComplete }) => {
  const count = 400;
  const pointsRef = useRef();

  const [data] = useState(() => {
    const positions = new Float32Array(count * 3);
    const velocities = [];
    for (let i = 0; i < count; i++) {
      positions[i*3] = (Math.random() - 0.5) * 5;
      positions[i*3+1] = (Math.random() - 0.5) * 5;
      positions[i*3+2] = (Math.random() - 0.5) * 5;
      velocities.push({
        x: (Math.random() - 0.5) * 1.5,
        y: (Math.random() - 0.5) * 1.5,
        z: (Math.random() - 0.5) * 1.5
      });
    }
    return { positions, velocities };
  });

  useFrame(() => {
    if (!pointsRef.current) return;
    const posAttr = pointsRef.current.geometry.attributes.position;
    for (let i = 0; i < count; i++) {
      posAttr.array[i*3] += data.velocities[i].x;
      posAttr.array[i*3+1] += data.velocities[i].y;
      posAttr.array[i*3+2] += data.velocities[i].z;
    }
    posAttr.needsUpdate = true;
    pointsRef.current.material.opacity -= 0.025;
    if (pointsRef.current.material.opacity <= 0) onComplete && onComplete();
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attachObject={['attributes', 'position']} count={count} array={data.positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={1.2} color={color} transparent opacity={1} blending={THREE.AdditiveBlending} depthWrite={false} />
    </points>
  );
};

// --- 3. [核心升级] 差异化行星外观 ---

// 3.1 岩石行星 (Rocky): 棱角分明，低多边形风格
const RockyVisuals = ({ color, size }) => {
  return (
    <group>
      {/* 核心实体: 使用 Icosahedron detail=0 制造棱角 */}
      <mesh>
        <icosahedronGeometry args={[size, 0]} />
        <meshStandardMaterial color={color} roughness={0.7} metalness={0.2} flatShading={true} />
      </mesh>
      {/* 线框覆盖，增强科技感 */}
      <mesh scale={[1.05, 1.05, 1.05]}>
        <icosahedronGeometry args={[size, 0]} />
        <meshBasicMaterial color={color} wireframe transparent opacity={0.3} />
      </mesh>
    </group>
  );
};

// 3.2 气态行星 (Gas): 光滑，多层大气，朦胧感
const GasVisuals = ({ color, size }) => {
  return (
    <group>
      {/* 内部核心 */}
      <mesh>
        <sphereGeometry args={[size * 0.8, 32, 32]} />
        <meshBasicMaterial color={color} />
      </mesh>
      {/* 流动大气层 (DistortMaterial) */}
      <Sphere args={[size, 32, 32]}>
        <MeshDistortMaterial
          color={color} speed={2} distort={0.2} radius={1}
          transparent opacity={0.6} roughness={0} metalness={0.5}
        />
      </Sphere>
      {/* 外部光晕 */}
      <mesh scale={[1.4, 1.4, 1.4]}>
        <sphereGeometry args={[size, 32, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.1} side={THREE.BackSide} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
    </group>
  );
};

// 3.3 环状行星 (Ring/Saturn): 带有明显光环
const RingVisuals = ({ color, size }) => {
  return (
    <group>
      {/* 星球本体 */}
      <mesh>
        <sphereGeometry args={[size, 32, 32]} />
        <meshStandardMaterial color={color} roughness={0.5} />
      </mesh>
      {/* 内环 */}
      <mesh rotation={[Math.PI / 2.5, 0, 0]}>
        <ringGeometry args={[size * 1.4, size * 2.0, 64]} />
        <meshBasicMaterial color={color} transparent opacity={0.6} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
      </mesh>
      {/* 外环线 */}
      <mesh rotation={[Math.PI / 2.5, 0, 0]}>
        <ringGeometry args={[size * 2.1, size * 2.15, 64]} />
        <meshBasicMaterial color={color} transparent opacity={0.3} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
};

// 3.4 地球型 (Earth): 类似岩石但更圆润，有发光
const EarthVisuals = ({ color, size }) => {
  return (
    <group>
      <mesh>
        <icosahedronGeometry args={[size, 4]} />
        <meshStandardMaterial color={color} roughness={0.5} metalness={0.8} />
      </mesh>
      <mesh scale={[1.2, 1.2, 1.2]}>
        <sphereGeometry args={[size, 16, 16]} />
        <meshBasicMaterial color={color} wireframe transparent opacity={0.15} />
      </mesh>
    </group>
  );
};

// --- 4. 统一的行星逻辑 ---
const Planet = ({ data, history }) => {
  const groupRef = useRef();
  const angleRef = useRef(Math.random() * Math.PI * 2);
  const [hovered, setHover] = useState(false);
  const [isExploding, setIsExploding] = useState(false);

  useFrame((state, delta) => {
    if (isExploding || !groupRef.current) return;

    // 公转 (悬停时减速)
    if (!hovered) angleRef.current += delta * data.speed * 0.2;
    const x = Math.cos(angleRef.current) * data.radius;
    const z = Math.sin(angleRef.current) * data.radius;
    groupRef.current.position.set(x, 0, z);

    // 自转
    groupRef.current.rotation.y += 0.01;
    groupRef.current.rotation.z = 0.2; // 稍微倾斜

    // 悬停缩放动画
    const targetScale = hovered ? 1.3 : 1.0;
    const cur = groupRef.current.scale.x;
    const next = THREE.MathUtils.lerp(cur, targetScale, 0.1);
    groupRef.current.scale.set(next, next, next);
  });

  const handleClick = (e) => {
    e.stopPropagation();
    setIsExploding(true);
    document.body.style.cursor = 'auto';
  };

  // 根据类型选择外观组件
  const renderVisuals = () => {
    switch(data.type) {
      case 'rocky': return <RockyVisuals color={data.color} size={data.size} />;
      case 'gas': return <GasVisuals color={data.color} size={data.size} />;
      case 'ring': return <RingVisuals color={data.color} size={data.size} />;
      case 'earth': return <EarthVisuals color={data.color} size={data.size} />;
      default: return <RockyVisuals color={data.color} size={data.size} />;
    }
  };

  return (
    <group>
      {!isExploding ? (
        <group ref={groupRef}>
          <group
            onClick={handleClick}
            onPointerOver={() => { document.body.style.cursor = 'pointer'; setHover(true); }}
            onPointerOut={() => { document.body.style.cursor = 'auto'; setHover(false); }}
          >
            {renderVisuals()}

            {/* 标签 */}
            <Html distanceFactor={80} position={[0, data.size + 2, 0]} center style={{ pointerEvents: 'none' }}>
              <div style={{
                color: hovered ? '#fff' : 'rgba(255,255,255,0.8)',
                fontWeight: 'bold', fontSize: '14px',
                textShadow: `0 0 10px ${data.color}`,
                whiteSpace: 'nowrap', opacity: hovered ? 1 : 0.6,
                background: hovered ? 'rgba(0,0,0,0.6)' : 'transparent',
                padding: '2px 8px', borderRadius: '4px',
                transition: 'all 0.2s', letterSpacing: '1px', borderBottom: hovered ? `2px solid ${data.color}` : 'none'
              }}>
                {data.title}
              </div>
            </Html>
          </group>
        </group>
      ) : (
        <group position={groupRef.current?.position}>
          <NativeExplosion color={data.color} onComplete={() => history.push(data.path)} />
        </group>
      )}

      {/* 轨道线 (更亮更明显) */}
      {!isExploding && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[data.radius - 0.1, data.radius + 0.1, 128]} />
          <meshBasicMaterial
            color={data.color}
            transparent
            opacity={0.15} // 提高不透明度
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      )}
    </group>
  );
};

// --- 5. 核心太阳 (更霸气) ---
const DataCoreSun = () => {
  return (
    <group>
      {/* 核心 */}
      <Sphere args={[7, 32, 32]}>
        <MeshDistortMaterial color="#ff6600" emissive="#ff2200" emissiveIntensity={2} speed={2} distort={0.2} />
      </Sphere>
      {/* 外部线框壳 */}
      <mesh scale={[1.2, 1.2, 1.2]}>
        <icosahedronGeometry args={[7, 1]} />
        <meshBasicMaterial color="#ffaa00" wireframe transparent opacity={0.2} />
      </mesh>
      {/* 能量环 */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[10, 10.5, 64]} />
        <meshBasicMaterial color="#ffaa00" transparent opacity={0.4} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
      </mesh>
      <pointLight distance={200} intensity={4} color="#ffaa00" />
      <Html position={[0, 0, 0]} center style={{ pointerEvents: 'none' }}>
        <div style={{
          color: '#fff', fontWeight: '900', fontSize: '28px',
          textShadow: '0 0 40px #ff3300', textAlign: 'center', letterSpacing: '6px',
          mixBlendMode: 'overlay'
        }}>
          HELLO<br/>ALGO
        </div>
      </Html>
    </group>
  );
};

// --- 6. 背景装饰 (Nebula Cloud 增加充实感) ---
const Nebula = () => {
  const count = 5;
  const data = useMemo(() => {
    return new Array(count).fill(0).map(() => ({
      x: (Math.random() - 0.5) * 200,
      y: (Math.random() - 0.5) * 50,
      z: (Math.random() - 0.5) * 200,
      scale: 20 + Math.random() * 20,
      color: Math.random() > 0.5 ? '#2f54eb' : '#bd00ff'
    }));
  }, []);

  return (
    <group>
      {data.map((d, i) => (
        <mesh key={i} position={[d.x, d.y, d.z]}>
          <sphereGeometry args={[d.scale, 16, 16]} />
          <meshBasicMaterial color={d.color} transparent opacity={0.03} depthWrite={false} blending={THREE.AdditiveBlending} />
        </mesh>
      ))}
    </group>
  );
};

// --- 7. 原生粒子星空 ---
const NativeStarField = () => {
  const count = 1500; // 增加星星数量
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for(let i=0; i<count; i++) {
      const r = 100 + Math.random() * 300;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);
      pos[i*3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i*3+2] = r * Math.cos(phi);
    }
    return pos;
  }, []);

  return (
    <points>
      <bufferGeometry><bufferAttribute attachObject={['attributes', 'position']} count={count} array={positions} itemSize={3} /></bufferGeometry>
      <pointsMaterial size={1.2} color="#888888" transparent opacity={0.8} sizeAttenuation />
    </points>
  );
};

// --- 8. 主场景 ---
const SolarSystem3D = () => {
  const history = useHistory();

  return (
    <div style={{ width: '100%', height: '100vh', background: '#020204' }}>
      <Canvas
        // 调整相机：视角更低，更广 (FOV 45 -> 55)，距离拉近 (Z 70 -> 60)
        camera={{ position: [0, 40, 60], fov: 55 }}
      >
        <ambientLight intensity={0.2} />

        {/* 环境层 */}
        <NativeStarField />
        <Nebula /> {/* 新增星云 */}

        {/* 底部全息网格 */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -15, 0]}>
          <planeGeometry args={[600, 600, 60, 60]} />
          <meshBasicMaterial color="#1a2b3c" wireframe transparent opacity={0.06} />
        </mesh>

        <DataCoreSun />

        {PLANETS.map((planet) => (
          <Planet key={planet.id} data={planet} history={history} />
        ))}

        <OrbitControls
          enablePan={false} enableZoom={true}
          maxDistance={200} minDistance={30}
          autoRotate={true} autoRotateSpeed={0.15}
          maxPolarAngle={Math.PI / 2} // 禁止钻地
        />
      </Canvas>

      {/* 底部提示 */}
      <div style={{
        position: 'absolute', bottom: '40px', width: '100%', textAlign: 'center', pointerEvents: 'none', zIndex: 10
      }}>
         <span style={{
           color: '#00f2ff', fontSize: '14px', letterSpacing: '3px', fontWeight: 'bold',
           textShadow: '0 0 10px rgba(0, 242, 255, 0.8)',
           background: 'rgba(0,0,0,0.8)', padding: '12px 40px', borderRadius: '4px',
           border: '1px solid rgba(0, 242, 255, 0.3)', boxShadow: '0 0 20px rgba(0, 242, 255, 0.1)'
         }}>
            SYSTEM ONLINE // INITIALIZING...
         </span>
      </div>
    </div>
  );
};

export default SolarSystem3D;