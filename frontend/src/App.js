import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import io from 'socket.io-client';
import axios from 'axios';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png'
import shadow from 'leaflet/dist/images/marker-shadow.png'

import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: iconRetina,
  iconUrl: icon,
  shadowUrl: shadow
});

const socket = io('http://localhost:5000');

const fadeIn = keyframes`
  from { opacity:0; transform: scale(0.95); }
  to { opacity:1; transform: scale(1); }
`;

const slideIn = keyframes`
  from { transform: translateX(100%); opacity: 0;}
  to { transform: translateX(0); opacity: 1;}
`;

const pulse = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(10, 255, 240, 0.7)}
  70% { box-shadow: 0 0 0 10px rgba(10, 255, 240, 0)}
  100% {box-shadow: 0 0 0 0 rgba(10, 255, 240, 0)}
`;

const glow = keyframes`
  0% { box-shadow: 0 0 5px rgba(74, 103, 255, 0.5)}
  70% { box-shadow: 0 0 15px rgba(74, 103, 255, 0.8)}
  100% {box-shadow: 0 0 5px rgba(74, 103, 255, 0.5)}
`;

const COLORS = {
  primary: '#4a67ff',
  secondary: '#ff4d6d',
  accent: '#0bf0e9',
  backgroundDark: '#0f1529',
  backgroundMedium: '#1a2349',
  backgroundLight: '#243066',
  textLight: '#ffffff',
  textMedium: '#c1d3ff',
  warning: '#ff4d6d',
  success: '#0bf0e9',
  gradient: 'linear-gradient(135deg, #4a67ff 0%, #ff4d6d 100%)',
};

const MainContent = styled.div`
  padding:30px;
  animation: ${fadeIn} 0.5s ease-out;

  @media(max-width: 768px){
    padding: 15px;
  }
`;

const SlideInDiv = styled.div`
 animation: ${slideIn} 0.5s ease-out
 `;

const SectionTitle = styled.div`
  font-size: 1.8rem;
  position: relative;
  padding-bottom: 10px;
  color: ${COLORS.textLight}
`;

const GContainer = styled.div`
  min-height: 100vh;
  background: ${COLORS.backgroundDark};
  color: ${COLORS.textLight}
  font-family: 'Roboto', sans-serif;
  overflow: hidden;
  position: relative;

  &::before{
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(ellipse at center, ${COLORS.backgroundLight} 0%, ${COLORS.backgroundDark} 70%);
    z-index: -1;
  }
`;

const GMapContainer = styled.div`
  height: 400px;
  width: 100%;
  border-radius: 12px;
  overflow: hidden;
  margin-top: 20px;
  box-shadow: 0 15px 30px rgba(0,0,0,0.3);
  border: 1px solid rgba(74, 103, 255, 0.3); 
`;

const GameContainer = styled.div`
  background: linear-gradient(135deg, #0f0c29, #302b63, #24243e);
  min-height: 100vh;
  color: #e0e0ff;
  font-family: 'Roboto', sans-serif;
  overflow-x: hidden;
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;

  h1{
    font-size: 1.8rem;
    font-weight: 700;
    background: ${COLORS.gradient};
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    text-shadow: 0 0 20px rgba(74, 103, 255, 0.5);
  }

  img {
    width: 40px;
    height: 40px;
    filter: drop-shadow(0 0 5px rgba(10, 255, 240, 0.7));
  }
`;

const GameHeader = styled.header`
  background: rgba(0,0,0,0.4);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(113, 108, 255, 0.3);
  padding: 15px 30px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  backdrop-filter: blur(10px);

  h1 {
    font-family: 'Orbitron', sans-serif;
    font-size: 2rem;
    margin: 0;
    background: linear-gradient(90deg, #8e54e9, #4776e6);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    text-shadow:  0 0 15px rgba(113, 108, 255, 0.5);
  }

  @media (max-width: 768px) {
    flex-direction: column;
    }
    `;

const GHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 40px;
    background: rgba(16, 24, 64, 0.7);
    backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(74, 103, 255, 0.3);
  
`;

const Footer = styled.div`
  text-align: center;
  padding: 20px;
  color: ${COLORS.textMedium};
  font-size: 0.9rem;
  border-top: 1px solid rgba(74, 103, 255, 0.2);
`;

const NavigationBar = styled.div`
  display: flex;
  gap: 20px;
  align-items: center;

  @media (max-width: 768px){
  justify-content: center;
  width: 100%;
  }

`;


const GameButton = styled.button`
  padding: 12px 24px;
  border: none;
  background: linear-gradient(135deg, #4776E6 0%, #8E54E9 100%);
  color: white;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  box-shadow: 0px 4px 14px rgba(71, 118, 230, 0.4);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba (71, 118, 230, 0.6);
  }

  &:before {
    before: "";
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255,255,255, 0.2),
      transparent
    );
    transition: 0.5s;
  }

  &:hover:before{
    left: 100%
  }
`;

const GButton = styled.div`
  padding: 12px 24px;
  border: none;
  background: ${props => props.primary ? COLORS.gradient : 'rgba(36, 48, 102, 0.7)'}
  color: white;
  border-radius: 50px;
  font-weight: 600;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px, rgba(0,0,0,0.2);
  position: relative;
  overflow: hidden;

  &:hover {
    transform: traslateY(-2px);
    box-shadow: 0 6px 20px rgba(74, 103, 255, 0.4);
  }

  &:active {
    transform: translateY(1px);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &::after{
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: 0.3s;
  }

  &:hover::after{
  left:100%;
  }
`;

const CardContainer = styled.div`
  display: grid;
  grid-template-colums: repeat(auto-fit, minmax(280px, 1fr));
  gap: 25px;
  padding: 30px;
`;

const GameCard = styled.div`
  background: rgba(25,25,25,0.8);
  backdrop-filter: blur(20px);
  border-radius: 15px;
  padding: 25px;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  box-shadow: 0 10px 30px rgba(0,0,0,0.3);
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(113, 108, 255, 0.3);
  
  &:hover{
    transform: translateY(-8px);
    box-shadow: 0 15px 35px rgba(71, 118, 230, 0.5);

    &:before{
      opacity: 0.1;
    }
  }

  &:before{
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(
      circle,
      rgba(113, 108, 255, 0.2) 0%,
      transparent 70%
    );
    pointer-events:none;
    opacity: 0;
    transition: opacity 0.4s ease;
  }

  h3{
    color: #8e54e9;
    font-size: 1.5rem;
    margin-top: 0;
  }
`;

const StatusIndicator = styled.div`
  display: inline-block;
  width: 15px;
  height: 15px;
  border-radius: 50%;
  margin-right: 10px;
  background: ${props => props.status === 'occupied' ? '#FF416C' : '#00c6ff'};
  box-shadow: 0 0 10px ${props => props.status === 'occupied' ? 'rgba(255, 65, 108, 0.7)' : 'rgba(0, 198, 255, 0.7)'};
`;

const ParkingSpaceContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(1, 1fr);
  gap: 15px;
  padding: 20px;
  background-color: #1a1a2e;
  min-height: 100vh;
`;
const ParkingSlotContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 15px;
  padding: 20px;
  background-color: #1a1a2e;
  min-height: 100vh;
`;

const ParkingSpace = styled.div`
  background-color: ${props => props.isOccupied ? '#ff6b6b' : '#b44ecdff'};
  border-radius: 10px;
  padding: 20px;
  text-align: center;
  color: white;
  transition: all 0.3s ease;
  cursor: pointer;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);

  &:hover{
    transform: scale(1.03);
  }
`;

const ParkingSpaceCard = styled.div`
  background: rgbe(36, 48, 102, 0.6);
  border-radius: 12px;
  padding: 25px;
  text-align: center;
  color: white;
  transition: all 0.3s ease;
  cursor: pointer;
  box-shadow: 0 8px 25px rgba(0,0,0,0.3);
  backdrop-filter: blur(5px);
  border: 1px solid rgba(74, 103, 255, 0.2);
  animation: ${fadeIn} 0.5s ease-out;
  position: relative;
  overflow: hidden;

  &:hover {
    transform: translateY(-8px);
    box-shadow: 0 15px 35px rgba(74, 103, 255, 0.25);
  }

  &:before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    height: 200%;
    width: 200%;
    background: radial-gradient(circle, rgba(74, 103, 255, 0.1) 0%, transparent 70%);
    transition: opacity 0.4s ease;
    opacity: 0;
    pointer-events: none; 
  }

  &:hover:before{
    opacity: 1;
  }

  h3 {
    font-size: 1.4rem;
    margin-bottom: 15px;
    font-weight: 600
  }

  .space-info{
    display: flex;
    justify-content: space-between;
    font-size: 0.9rem;
    color: ${COLORS.textMedium}
  }

  .span {
    display: flex;
    align-items: center;
    gap: 5px;

    &.occupied {
      color: ${COLORS.warning}
    }

    &.available {
      color: ${COLORS.success}
    }
  }

`;

const ParkingSlotCard = styled.div`
   background: ${props =>
    props.isOccupied
      ? 'rgba(255, 77, 109, 0.2)'
      : 'rgba(11, 240, 233, 0.2)'};
      border-radius: 12px;
      padding: 20px;
      text-align: center;
      color: white;
      transition: all 0.3s ease;
      cursor: pointer;
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
      backdrop-filter: blur(5px);
      border: 1px solid ${props => props.isOccupied
    ? 'rgba(255, 77, 109, 0.3)'
    : 'rgba(11, 240, 233, 0.3)'};
        animation: ${fadeIn} 0.5s ease-out;
        position: relative;
        overflow: hidden;

        &:hover{
          transform: translateY(-5px);
          box-shadow: 0 12px 30px ${props => props.isOccupied
    ? 'rgba(255, 77, 109, 0.25)'
    : 'rgba(11, 240, 233, 0.25)'
  };
        }

        h3{
          font-size: 1.3rem;
          margin-bottom: 10px;
          font-weight: 600;
          color: ${props => props.isOccupied
    ? COLORS.warning
    : COLORS.success
  };

        .slot-info{
          font-size: 0.85rem;
          color: ${COLORS.textMedium};

          p{
            margin: 5px 0;
          }
        }
          .slot-status{
            position: absolute;
            top: 15px;
            right: 15px;
            width: 15px;
            height: 15px;
            border-radius: 50%;
            background: ${props => props.isOccupied
    ? COLORS.warning
    : COLORS.success
  };
            box-shadow: ${props => props.isOccupied
    ? COLORS.warning
    : COLORS.success
  };
          }
        }
`;

const SlotInfo = styled.div`
  font-size: 0.9em;
  margin-top: 10px;
`;

const StyledButton = styled.button`
  padding: .5em 1.5em;
  margin: .5em;
  pointer: cursor;
  height: 35px;
`;

const StyledModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0,0,0,0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const StyledModalContent = styled.div`
  background-color: #16213e;
  padding: 20px;
  border-radius: 8px;
  width: 90%;
  max-width: '600px;
`;

const StatsContainer = styled.div`
  background: rgba(36, 48, 102, 0.6);
  backdrop-filter: blur(10px);
  padding: 5px;
  border-radius: 15px;
  margin-bottom: 40px;
  color: white;
  border: 1px solid rgba(74,103, 255, 0.2);
  box-shadow: 0 15px 30px rgba(0,0,0,0.3);
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
`;

const StatCard = styled.div`
  background: rgba(26, 35, 73, 0.8);
  padding: 20px;
  border-radius: 12px;
  text-align: center;
  border: 1px solid rgba(74, 103, 255, 0.2);
  transition: all 0.3s ease;

  &:hover{
    transform: translateY(-5px);
    box-shadow: 0 10px 25px rgba(74, 103, 255, 0.2);
  }

  h3 {
    font-size: 1.1rem;
    margin-bottom: 15px;
    color: ${COLORS.textMedium}
  }

  .stat-value {
    font-size: 2rem;
    font-weight: 700;
    background: ${COLORS.gradient};
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
`;

const ChartsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); 
  gap: 25px;

  @media (max-width: 768px){
    grid-template-columns: 1fr; 
  }
`;

const ChartContainer = styled.div`
  background: rgba(26, 35, 73, 0.8);
  border-radius: 12px;
  margin-bottom: 20px;
  height: 350px;
  border: 1px solid rgba(74, 103, 255, 0.2);
`;


const TabContainer = styled.div`
  display: flex;
  margin-bottom: 20px;
  background: #2d2d44; 
  border-radius: 10px;
  overflow: hidden;
`;

const Tab = styled.button`
  flex: 1;
  padding: 15px;
  background: ${props => props.active ? '#4ecdc4' : 'transparent'};
  color: white;
  border: none;
  cursor: pointer;
  transition: background 0.3 ease;

  &:hover {
    background: ${props => props.active ? '#4ecdc4' : '#3d3d5c'}
  }
`;

const calculateStatistics = (slots, spaces = []) => {
  const totalSlots = slots.length;
  const occupiedSlots = slots.filter(slot => slot.status.isOccupied).length;
  const availableSlots = totalSlots - occupiedSlots;
  const occupancyRate = totalSlots > 0 ? (occupiedSlots / totalSlots * 100).toFixed(1) : 0;

  const now = new Date();
  const lastHour = slots.filter(slot =>
    slot.status.isOccupied &&
    slot.vehicleInfo?.entryTime &&
    (now - new Date(slot.vehicleInfo.entryTime)) < 3600000 // 1 hour
  ).length;

  return {
    totalSlots,
    occupiedSlots,
    availableSlots,
    occupancyRate,
    lastHourOccupancy: lastHour,
    spaceCount: spaces.length
  };
};

const StatisticsView = ({ slots, spaces, onBack }) => {
  const stats = calculateStatistics(slots, spaces);

  const occupancyData = [
    { name: 'Occupied', value: stats.occupiedSlots },
    { name: 'Available', value: stats.availableSlots }
  ];

  const COLORS = ['#ff6b6b', '#4ecdc4'];
  return (
    <MainContent>
      <SectionTitle>Parking Analytics Dashboard</SectionTitle>
      <StatsContainer>
        {/* Metrics*/}

        <StatsGrid>
          <StatCard>
            <h3>Total Slots</h3>
            <p style={{ fontSize: '2em', fontWeight: 'bold' }}>{stats.totalSlots}</p>
          </StatCard>
          <StatCard>
            <h3>Occupied</h3>
            <p style={{ fontSize: '2em', fontWeight: 'bold', color: '#ff6b6b' }}>{stats.occupiedSlots}</p>
          </StatCard>
          <StatCard>
            <h3>Available</h3>
            <p style={{ fontSize: '2em', fontWeight: 'bold', color: '#4ecdc4' }}>{stats.availableSlots}</p>
          </StatCard>
          <StatCard>
            <h3>Occupancy Rate</h3>
            <p style={{ fontSize: '2em', fontWeight: 'bold' }}>{stats.occupancyRate}%</p>
          </StatCard>
        </StatsGrid>

        {/* Charts*/}
        <ChartsGrid>
          <ChartContainer>
            <h3 style={{ marginBottom: '20px', textAlign: 'center' }}>Occupancy Distribution</h3>
            <ResponsiveContainer width="100%" height="80%">
              <PieChart>
                <Pie
                  data={occupancyData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}>
                  {occupancyData.map((entry, index) => (
                    <Cell key={'cell-${index}'} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>

          <ChartContainer>
            <h3 style={{ marginBottom: '20px', textAlign: 'center' }}>Real-time Occupancy</h3>
            <ResponsiveContainer width="100%" height="80%">
              <BarChart data={[
                { name: 'Current', occupied: stats.occupiedSlots, available: stats.availableSlots },
                { name: 'Last Hour', occupied: stats.lastHourOccupancy, available: stats.totalSlots - stats.lastHourOccupancy }
              ]}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.backgroundLight} />
                <XAxis dataKey="name" stroke={COLORS.textLight} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="occupied" fill="#ff6b6b" name="Occupied" />
                <Bar dataKey="available" fill="#4ecd4d" name="Available" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>

        </ChartsGrid>
      </StatsContainer>

    </MainContent>
  )
};

const ParkingSlot = ({ slot, handleGpsClick }) => {
  return (
    <GameCard isOccupied={slot.isOccupied}>
      <h3>
        <StatusIndicator status={slot.isOccupied ? "occupied" : "available"}></StatusIndicator>
        Slot {slot.slotNumber}
      </h3>

      <div className='slot-details'>
        {slot.isOccupied ? (
          <>
            <p>Occupied</p>
            <p>Parked at:  {new Date(slot.vehicleInfo.entryTime).toLocaleTimeString()}</p>
          </>
        ) : (
          <p>Available</p>
        )}
      </div>

      <div className='slot-actions'>
        <GameButton mini onClick={() => handleGpsClick(slot)}>View map</GameButton>
      </div>
    </GameCard>
  );
}


const ParkingSlotView = ({ parkingSlots, onBack, handleSlotClick, handleGpsClick, isMapOpen, selectedSlot, handleCloseMap }) => (
  // <div style={{ padding: '20px', backgroundColor: '#1a1a2e', minHeight: '100vh' }}>
  // <StyledButton onClick={onBack}>Back to Spaces</StyledButton>
  <ParkingSlotContainer>
    {parkingSlots.length === 0
      ? <div>Loading parking slots...</div>
      : parkingSlots.map(slot =>
        <ParkingSlotCard
          key={slot._id}
          isOccupied={slot.status.isOccupied}
          slot={slot}
          onClick={() => handleSlotClick(slot)}
          handleGpsClick={handleGpsClick}
        >
          <div className='slot-status'>

            <h3>Slot {slot.slotNumber}</h3>
          </div>
          <div className='slot-info'>
            {slot.status.isOccupied ? (
              <>
                <p><span style={{ color: COLORS.warning }}>Occupied</span></p>
                <p>Parked at: {new Date(slot.status.vehicleInfo.entryTime).toLocaleTimeString()}</p>
              </>
            ) : (
              <p><span style={{ color: COLORS.success }}>Available</span></p>
            )}
          </div>
          <div style={{ marginTop: '15px' }}>

            <GButton onClick={() => handleGpsClick(slot)} style={{ padding: '8px 26px', fontSize: '0.9rem' }}>View on map</GButton>
          </div>

        </ParkingSlotCard>
      )}
    {isMapOpen && selectedSlot && (
      <div style={{ marginTop: '30px' }}>
        <MapModalView slot={selectedSlot} onClose={handleCloseMap}></MapModalView>
      </div>
    )}
  </ParkingSlotContainer>


);

const ParkingSpacesView = ({ parkingSpaces, handleSpaceClick, parkingSlots }) => {
  const availableSpaces = parkingSlots.length;
  const occupiedSpaces = parkingSlots.filter(slot => slot.status.isOccupied).length;

  return (
    <MainContent>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <SectionTitle>Parking Locations</SectionTitle>
        <div style={{ display: 'flex', gap: '15px' }}>
          <div style={{ background: 'rgba(26,35,73,0.3)', padding: '10px 20px', borderRadius: '50px', border: `1px solid ${COLORS.success}` }}>
            <span style={{ color: `${COLORS.textLight}` }}>Available slots: </span>
            <span style={{ color: `${COLORS.success}`, fontWeight: `bold` }}>{availableSpaces}</span>
          </div>
          <div style={{ background: 'rgba(26,35,73,0.3)', padding: '10px 20px', borderRadius: '50px', border: `1px solid ${COLORS.success}` }}>
            <span style={{ color: `${COLORS.textLight}` }}>Occupied slots: </span>
            <span style={{ color: `${COLORS.success}`, fontWeight: `bold` }}>{occupiedSpaces}</span>
          </div>
        </div>
      </div>
      <ParkingSpaceContainer>
        {parkingSpaces.length === 0
          ? <div>Loading parking spaces...</div>
          : parkingSpaces.map(space => {
            const yardSlots = parkingSlots.filter(slot => slot.yardId === space._id);
            const available = yardSlots.filter(slot => !slot.status.isOccupied).length;
            const occupied = yardSlots.filter(slot => slot.status.isOccupied).length;
            const occupancyRate = (occupied / yardSlots.length * 100).toFixed(0);
            return (
              <ParkingSpaceCard key={space.name} onClick={() => handleSpaceClick(space)}>
                <h3>{space.name}</h3>
                <div className="space-info">
                  <span className='available'>Available: {available}</span>
                  <span className='occupied'>Occupied: {occupied}</span>
                </div>
                <div style={{ marginTop: '15px' }}>
                  <div style={{ height: '8px', background: 'rgba(26,35, 73, 0.8)', borderRadius: '50px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: `${COLORS.gradient}`, width: `${occupancyRate}%`, transition: 'width 0.5s ease', borderRadius: '50px' }}></div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px' }}>
                    <span>0%</span>
                    <span style={{ fontWeight: 'bold' }}> Occupancy: {occupancyRate}%</span>
                    <span>100%</span>
                  </div>
                </div>
              </ParkingSpaceCard>
            )
          }
          )}
      </ParkingSpaceContainer>
    </MainContent>
  );
};

const MapView = ({ lng, lat, slot }) => (
  <div style={{ height: '300px', width: '100%', border: '1px solid black', borderRadius: '12px' }}>
    <MapContainer center={[lng, lat]} zoom={100} style={{ height: '100%', width: '100%' }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' />
      <Marker position={[lng, lat]}>
        <Popup>Parking Slot #{slot.slotNumber}</Popup>
      </Marker>
    </MapContainer>
  </div>
);

const MapModalView = ({ slot, onClose }) => (
  <StyledModalOverlay>
    <StyledModalContent>
      <SectionTitle>Slot Location</SectionTitle>
      <MapView lat={slot.lat} lng={slot.lng} slot={slot} />
      <div style={{ textAlign: 'center', marginTop: '15px' }}>
        <GButton onClick={onClose} style={{ marginTop: '13px' }}>Close map view</GButton>
      </div>
    </StyledModalContent>
  </StyledModalOverlay>
);

function App() {
  const [view, setView] = useState('spaces');
  const [parkingSpaces, setParkingSpaces] = useState([]);
  const [selectedSpace, setSelectedSpace] = useState(null);
  const [parkingSlots, setParkingSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [isMapOpen, setIsMapOpen] = useState(false);

  const [showStatistics, setShowStatistics] = useState(false);


  useEffect(() => {

    const fetchParkingYards = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/yards');
        setParkingSpaces(response.data);
      } catch (error) {
        console.log("error while fetching parking yards: ", error);
      }
    };
    const fetchParkingSlots = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/slots');
        setParkingSlots(response.data);
      } catch (error) {
        console.log("error while fetching parking slots: ", error);
      }
    };

    fetchParkingYards();
    fetchParkingSlots();

    socket.on('slotStatusUpdated', (updatedSlot) => {
      setParkingSlots(prevSlots =>
        prevSlots.map(slot => slot._id === updatedSlot._id ? updatedSlot : slot)
      )
    });

    socket.on('parkingStatusUpdate', (updatedSlot) => {
      setParkingSlots(prev => ({
        ...prev,
        slots: prev.map(slot =>
          slot.slotNumber === updatedSlot.slotNumber ? updatedSlot : slot
        )
      })
      )
    });

    return () => {
      socket.off('parkingStatus');
      socket.off('parkingStatusUpdate');
    }
  }, [selectedSpace]);

  const handleSlotClick = (slot) => {
    setSelectedSlot(slot);
  };
  const handleSpaceClick = (space) => setSelectedSpace(space);
  const handleGpsClick = (slot) => {
    setSelectedSlot(slot);
    handleOpenMap();
  };
  const handleOpenMap = () => {
    setIsMapOpen(true);
    console.log(isMapOpen);
  };
  const handleCloseMap = () => {
    setIsMapOpen(false);
  }

  const handleShowStatistics = () => setShowStatistics(true);
  const handleHideStatistics = () => setShowStatistics(false);

  const currentSelectedSpace = selectedSpace == null ? null : parkingSpaces.find(space => space.id === selectedSpace.id);


  if (showStatistics) {
    return (
      <div>
        <GameHeader>
          <Logo>
            <h1>SmartPark</h1>
          </Logo>
          <NavigationBar>
            <GButton primary onClick={handleHideStatistics}>Back to dashboard</GButton>
          </NavigationBar>
        </GameHeader>
        <StatisticsView
          slots={selectedSpace ? parkingSlots.filter(slot => slot.yardId === selectedSpace._id) : parkingSlots}
          spaces={parkingSpaces}
          onBack={handleHideStatistics}
        />
        <Footer>
          Smart Parking Management System - Real-time monitoring
        </Footer>
      </div>
    )
  }

  if (currentSelectedSpace) {
    const handleBack = () => {
      setSelectedSpace(null);
      setSelectedSlot(null);
      setIsMapOpen(false);
    };

    return (
      <div>
        <GameHeader>
          <Logo>
            <h1>SmartPark</h1>
          </Logo>
          <NavigationBar>
            <GButton onClick={handleBack}>Back to Locations</GButton>
            <GButton primary onClick={handleShowStatistics}>View Statistics</GButton>
          </NavigationBar>
        </GameHeader>
        <ParkingSlotView
          parkingSlots={parkingSlots}
          onBack={handleBack}
          handleSlotClick={handleSlotClick}
          handleGpsClick={handleGpsClick}
          isMapOpen={isMapOpen}
          selectedSlot={selectedSlot}
          handleCloseMap={handleCloseMap}
          handleOpenMap={handleOpenMap} />
      </div>
    )
  } else {
    return (
      <GContainer>
        <GameHeader>
          <Logo>
            <h1>SmartPark</h1>
          </Logo>
          <NavigationBar>
            <GButton primary onClick={handleShowStatistics}>View Statistics</GButton>
          </NavigationBar>
        </GameHeader>
        <ParkingSpacesView
          parkingSpaces={parkingSpaces}
          handleSpaceClick={handleSpaceClick}
          parkingSlots={parkingSlots} />
        <Footer>
          Smart Parking Management System - Real-time monitoring
        </Footer>
      </GContainer>
    )
  }
}

export default App;