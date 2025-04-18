// PlannerForm.tsx
import React, { useState, ChangeEvent, FormEvent } from 'react';
import styled from 'styled-components';
import { Loader2Icon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext'
const Container = styled.div`
  max-width: 900px;
  margin: 2rem auto;
  padding: 2rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  color: #f0f0f0;
  font-family: 'Helvetica Neue', sans-serif;
`;

const Section = styled.section`
  margin-bottom: 2rem;
`;

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  margin-bottom: 1rem;
  border-bottom: 2px solid rgba(255, 255, 255, 0.2);
  padding-bottom: 0.5rem;
`;

const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: 1rem;
`;

const Label = styled.label`
  font-weight: 600;
  margin-bottom: 0.3rem;
`;

const Input = styled.input`
  padding: 0.6rem 1rem;
  border: none;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  font-size: 1rem;

  &:focus {
    outline: 2px solid #7f5af0;
  }
`;

const Textarea = styled.textarea`
  padding: 0.6rem 1rem;
  border: none;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  font-size: 1rem;
  resize: vertical;

  &:focus {
    outline: 2px solid #7f5af0;
  }
`;

const Select = styled.select`
  padding: 0.6rem 1rem;
  border: none;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  font-size: 1rem;

  &:focus {
    outline: 2px solid #7f5af0;
  }
`;

const CheckboxRow = styled.div`
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.9rem;
`;

const Button = styled.button`
  padding: 0.8rem 2rem;
  background: #7f5af0;
  color: #fff;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.2s ease;

  &:hover {
    background: #6931f9;
  }
`;

type FormData = {
  objectiveTitle: string;
  whyItMatters: string;
  startDate: string;
  endDate: string;
  smart: Record<'S' | 'M' | 'A' | 'R' | 'T', boolean>;
  // ... other arrays omitted for brevity
  dailyCheckIn: string;
  weeklyReview: string;
  dndStart: string;
  dndEnd: string;
  workHours: number;
  pomodoroRatio: string;
};

export const PlannerForm: React.FC = () => {
  const [data, setData] = useState<FormData>({
    objectiveTitle: '',
    whyItMatters: '',
    startDate: '',
    endDate: '',
    smart: { S: false, M: false, A: false, R: false, T: false },
    // ... initialize other fields/mocks
    dailyCheckIn: '',
    weeklyReview: '',
    dndStart: '',
    dndEnd: '',
    workHours: 8,
    pomodoroRatio: '25/5',
  });

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const target = e.target;
    const name = target.name;
    let value: string | number | boolean;

    // Narrow to HTMLInputElement for .checked and .valueAsNumber
    if (target instanceof HTMLInputElement) {
      if (target.type === 'checkbox') {
        value = target.checked;
      } else if (target.type === 'number') {
        value = target.valueAsNumber;
      } else {
        value = target.value;
      }
    } else {
      // HTMLTextAreaElement or HTMLSelectElement
      value = target.value;
    }

    setData(prev => {
      // SMART checkboxes go into nested object
      if (name in prev.smart && typeof value === 'boolean') {
        return {
          ...prev,
          smart: { ...prev.smart, [name]: value },
        };
      }
      // Otherwise top‑level keys
      return {
        ...prev,
        [name]: value,
      } as any;
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('jwtToken');
      const response = await fetch('http://localhost:8080/api/plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
  
      if (!response.ok) throw new Error('Failed to save plan');
      
      // Reset form
      setData({
        objectiveTitle: '',
        whyItMatters: '',
        startDate: '',
        endDate: '',
        smart: { S: false, M: false, A: false, R: false, T: false },
        dailyCheckIn: '',
        weeklyReview: '',
        dndStart: '',
        dndEnd: '',
        workHours: 8,
        pomodoroRatio: '25/5',
      });
  
    } catch (error) {
      console.error('Error saving plan:', error);
    }
  };
  
  // Add loading state
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <Container>
      <form onSubmit={handleSubmit}>
        {/* Vision & Objectives */}
        <Section>
          <SectionTitle>Vision &amp; Objectives</SectionTitle>
          <FieldGroup>
            <Label>Objective Title</Label>
            <Input
              name="objectiveTitle"
              value={data.objectiveTitle}
              onChange={handleChange}
              placeholder="Enter your main objective"
            />
          </FieldGroup>

          <FieldGroup>
            <Label>Why It Matters</Label>
            <Textarea
              name="whyItMatters"
              rows={3}
              value={data.whyItMatters}
              onChange={handleChange}
              placeholder="Describe the purpose"
            />
          </FieldGroup>

          <FieldGroup>
            <Label>Timeframe</Label>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <Input
                type="date"
                name="startDate"
                value={data.startDate}
                onChange={handleChange}
              />
              <Input
                type="date"
                name="endDate"
                value={data.endDate}
                onChange={handleChange}
              />
            </div>
          </FieldGroup>

          <FieldGroup>
            <Label>SMART Checks</Label>
            <CheckboxRow>
              {(['S','M','A','R','T'] as const).map(letter => (
                <CheckboxLabel key={letter}>
                  <input
                    type="checkbox"
                    name={letter}
                    checked={data.smart[letter]}
                    onChange={handleChange}
                  />
                  {letter}
                </CheckboxLabel>
              ))}
            </CheckboxRow>
          </FieldGroup>
        </Section>

        {/* ... other sections (Key Results, Action Items, etc.) */}

        {/* Review Cadence */}
        <Section>
          <SectionTitle>Review Cadence</SectionTitle>
          <FieldGroup>
            <Label>Daily Check‑in Time</Label>
            <Input
              type="time"
              name="dailyCheckIn"
              value={data.dailyCheckIn}
              onChange={handleChange}
            />
          </FieldGroup>
          <FieldGroup>
            <Label>Weekly Review Day</Label>
            <Select
              name="weeklyReview"
              value={data.weeklyReview}
              onChange={handleChange}
            >
              <option value="">Select a day</option>
              {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']
                .map(d => <option key={d}>{d}</option>)}
            </Select>
          </FieldGroup>
        </Section>

        {/* User Preferences */}
        <Section>
          <SectionTitle>User Preferences</SectionTitle>
          <FieldGroup>
            <Label>Do‑Not‑Disturb Window</Label>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <Input
                type="time"
                name="dndStart"
                value={data.dndStart}
                onChange={handleChange}
              />
              <Input
                type="time"
                name="dndEnd"
                value={data.dndEnd}
                onChange={handleChange}
              />
            </div>
          </FieldGroup>
          <FieldGroup>
            <Label>Working Hours per Day</Label>
            <Input
              type="number"
              name="workHours"
              min={1}
              max={24}
              value={data.workHours}
              onChange={handleChange}
            />
          </FieldGroup>
          <FieldGroup>
            <Label>Focus Blocks &amp; Breaks Ratio</Label>
            <Input
              name="pomodoroRatio"
              value={data.pomodoroRatio}
              onChange={handleChange}
              placeholder="e.g. 25/5"
            />
          </FieldGroup>
        </Section>

        <Button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full py-3 text-lg flex items-center justify-center gap-2"
            >
            {isSubmitting ? (
                <Loader2Icon className="animate-spin w-5 h-5" />
            ) : (
                'Save Planner'
            )}
            </Button>
      </form>
    </Container>
  );
};

// export default Planner;
