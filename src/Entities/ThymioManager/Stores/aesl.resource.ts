import { EventDescription } from '@mobsya-association/thymio-api';

export const eventsDefinition: EventDescription[] = [
  { name: 'Q_add_motion', fixed_size: 6, index: 20 },
  { name: 'Q_cancel_motion', fixed_size: 1, index: 21 },
  { name: 'Q_motion_added', fixed_size: 5, index: 22 },
  { name: 'Q_motion_cancelled', fixed_size: 5, index: 23 },
  { name: 'Q_motion_started', fixed_size: 5, index: 24 },
  { name: 'Q_motion_ended', fixed_size: 5, index: 25 },
  { name: 'Q_motion_noneleft', fixed_size: 1, index: 26 },
  { name: 'Q_set_odometer', fixed_size: 5, index: 27 },
  { name: 'V_leds_prox_h', fixed_size: 10, index: 28 },
  { name: 'V_leds_circle', fixed_size: 10, index: 29 },
  { name: 'V_leds_top', fixed_size: 5, index: 30 },
  { name: 'V_leds_top_and_bottom', fixed_size: 5, index: 31 },
  { name: 'V_leds_bottom', fixed_size: 6, index: 32 },
  { name: 'V_leds_buttons', fixed_size: 6, index: 33 },
  { name: 'V_leds_rc', fixed_size: 3, index: 34 },
  { name: 'V_leds_temperature', fixed_size: 4, index: 35 },
  { name: 'V_leds_sound', fixed_size: 3, index: 36 },
  { name: 'V_leds_off', fixed_size: 3, index: 37 },
  { name: 'A_sound_freq', fixed_size: 4, index: 38 },
  { name: 'A_sound_play', fixed_size: 3, index: 39 },
  { name: 'A_sound_system', fixed_size: 3, index: 40 },
  { name: 'A_sound_replay', fixed_size: 3, index: 41 },
  { name: 'A_sound_record', fixed_size: 3, index: 42 },
  { name: 'A_noise_detect', fixed_size: 2, index: 43 },
  { name: 'M_motor_left', fixed_size: 3, index: 44 },
  { name: 'M_motor_right', fixed_size: 3, index: 45 },
  { name: 'M_motors', fixed_size: 4, index: 46 },
  { name: 'Q_reset', fixed_size: 2, index: 47 },
  { name: 'Prox', fixed_size: 13, index: 48 },
  { name: 'Ground', fixed_size: 3, index: 49 },
  { name: 'Odometer', fixed_size: 4, index: 50 },
  { name: 'Acc_tap', fixed_size: 1, index: 51 },
  { name: 'B_center', fixed_size: 1, index: 52 },
  { name: 'B_forward', fixed_size: 1, index: 53 },
  { name: 'B_backward', fixed_size: 1, index: 54 },
  { name: 'B_left', fixed_size: 1, index: 55 },
  { name: 'B_right', fixed_size: 1, index: 56 },
  { name: 'ThymioId', fixed_size: 1, index: 57 },
  { name: 'Inizializer', fixed_size: 2, index: 58 },
  { name: 'ACK', fixed_size: 2, index: 59 },
  { name: 'runMotors', fixed_size: 4, index: 60 },
];

export const asebaScript = `
var tmp[9]
var Qid[4]   = [ 0,0,0,0 ]
var Qtime[4] = [ 0,0,0,0 ]
var QspL[4]  = [ 0,0,0,0 ]
var QspR[4]  = [ 0,0,0,0 ]
var Qpc = 0
var Qnx = 0
var Qva = 0
var distance.front = 190
var distance.back  = 125
var angle.front    = 0
var angle.back     = 0
var angle.ground   = 0
var odo.delta
var odo.theta = 0
var odo.x = 0
var odo.y = 0
var odo.degree
var mic.filter = 0

var prox_horizontal[7]
var prox_horizontal_prev[7] = [0, 0, 0, 0, 0, 0, 0]

var groundSensorLeftPrev = 0
var groundSensorRightPrev = 0

var groundSensorLeftNormalized = 0
var groundSensorRightNormalized = 0

var soundStatus = 0

var micIntensity_prev = 0

var prevOdoX = 0
var prevOdoY = 0
var prevOdoDegree = 0

var deltaX = 0
var deltaY = 0

var lastMicIntensity = -1

var changed = 0
var i = 0
var H_minMaxValue = 4000  # Minimum maximum value for proximity sensors
var G_minMaxValue = 1000  # Minimum maximum value for ground sensors
var H_scaleFactor = 100  # Scale factor to increase precision
var G_scaleFactor = 50  # Scale factor to increase precision
var tempValue
var normalizedMax = 4 * H_scaleFactor

# Variables to store the current values
var distance_front
var distance_back
var angle_front
var angle_back
var angle_ground

var ThymioId = 0
mic.threshold = 250

# *******************************
# Inizializer event to send the id of the robot
# params: _id
# _id: id of the robot
# *******************************
onevent Inizializer
    if ThymioId == 0 then
        soundStatus = 1
        timer.period[0] = 2000
        ThymioId = _id
        emit ThymioId _id
        call sound.system(event.args[2])
    end

onevent tap
    emit Acc_tap _id

onevent mic
    # Check if motor is moving slowly
    if soundStatus == 0 and motor.left.target < 120 and motor.left.target > -120 and motor.right.target < 120 and motor.right.target > -120 then
        if mic.intensity != micIntensity_prev  and soundStatus == 0 then
            emit A_noise_detect([_id, mic.intensity])
            mic.filter = 0
            timer.period[1] = 400
            micIntensity_prev = mic.intensity
        end
    else
        # Increase the filter value to send the event only if the mic intensity is stable
        mic.filter += 1
        if mic.filter > 10 and soundStatus == 0 then
            if mic.intensity != micIntensity_prev then
                emit A_noise_detect([_id, mic.intensity])
                mic.filter = 0
                timer.period[1] = 400
                micIntensity_prev = mic.intensity
            end
        end
    end

onevent button.center
    if button.center == 1 then
        emit B_center _id
    end

onevent button.forward
    if button.forward == 1 then
        emit B_forward _id
    end

onevent button.backward
    if button.backward == 1 then
        emit B_backward _id
    end

onevent button.left
    if button.left == 1 then
        emit B_left _id
    end

onevent button.right
    if button.right == 1 then
        emit B_right _id
    end

# *******************************
# set odometry of the robot
# params: _id, event_index, theta, x, y
# _id: id of the robot
# event_index: index number of the event
# theta: angle of the robot (degrees) (-180-180)
# x: x position of the robot (mm)
# y: y position of the robot (mm)
# *******************************
onevent Q_set_odometer
    if event.args[0]==_id then
        emit ACK([_id,event.args[1]])
        event.args[2] = event.args[0] % 180
        call math.muldiv(odo.theta,event.args[2],8192,45)
        odo.x = event.args[3]*79
        odo.y = event.args[4]*79
    end

# *******************************
# stop motors and reset odometry
# params: _id, event_index
# _id: id of the robot
# event_index: index number of the event
# *******************************
onevent Q_reset
    if event.args[0]==_id then
        emit ACK([_id,event.args[1]])
        call math.fill(Qid,0)
        call math.fill(Qtime,0)
        call math.fill(QspL,0)
        call math.fill(QspR,0)
        call math.fill(Qpc,0)
        call math.fill(Qnx,0)
        motor.left.target = 0
        motor.right.target = 0
        #emit Q_motion_noneleft([Qpc])
    end

# *******************************
# Change color led bottom
# params: _id, event_index, led, red, green, blue
# _id: id of the robot
# event_index: index number of the event
# led: led number (0-2), 0 is bottom
# red, green, blue: color values
# *******************************
onevent V_leds_bottom
    if event.args[0]==_id then
        emit ACK([_id,event.args[1]])
        if event.args[2]==0 then
            call leds.bottom.left(event.args[3],event.args[4],event.args[5])
        elseif event.args[2]==1 then
            call leds.bottom.right(event.args[3],event.args[4],event.args[5])
        else
            call leds.bottom.left(event.args[3],event.args[4],event.args[5])
            call leds.bottom.right(event.args[3],event.args[4],event.args[5])
        end
    end

# *******************************
# Change color led buttons
# params: _id, event_index, button up, button down, button left, button right
# _id: id of the robot
# event_index: index number of the event
# button up, button down, button left, button right: button values (0 or 1)
# *******************************
onevent V_leds_buttons
    if event.args[0]==_id then
        emit ACK([_id,event.args[1]])
        call leds.buttons(event.args[2],event.args[3], event.args[4], event.args[5])
    end

# *******************************
# Change color led circle
# params: _id, event_index, led1, led2, led3, led4, led5, led6, led7, led8
# _id: id of the robot
# event_index: index number of the event
# led1, led2, led3, led4, led5, led6, led7, led8: circle leds values intensity (1-32) or off (0)
# *******************************
onevent V_leds_circle
    if event.args[0]==_id then
        emit ACK([_id,event.args[1]])
        call leds.circle(event.args[2],event.args[3],event.args[4],
                        event.args[5],event.args[6],event.args[7],
                        event.args[8],event.args[9])
    end

onevent V_leds_prox_h
    if event.args[0]==_id then
        emit ACK([_id,event.args[1]])
        call leds.prox.h(event.args[2],event.args[3],event.args[4],event.args[5],
                        event.args[6],event.args[7],event.args[8],event.args[9])
    end

onevent V_leds_rc
    if event.args[0]==_id then
        emit ACK([_id,event.args[1]])
        call leds.rc(event.args[2])
    end

onevent V_leds_sound
    if event.args[0]==_id then
        emit ACK([_id,event.args[1]])
        call leds.sound(event.args[2])
    end

onevent V_leds_temperature
    if event.args[0]==_id then
        emit ACK([_id,event.args[1]])
        call leds.temperature(event.args[2],event.args[3])
    end

onevent V_leds_top
    if event.args[0]==_id then
        emit ACK([_id,event.args[1]])
        call leds.top(event.args[2],event.args[3],event.args[4])
    end

# *******************************
# Change color led top and bottom
# params: _id, event_index, red, green, blue
# _id: id of the robot
# event_index: index number of the event
# red, green, blue: color values
# *******************************
onevent V_leds_top_and_bottom
    if event.args[0]==_id then
        emit ACK([_id,event.args[1]])
        call leds.top(event.args[2],event.args[3],event.args[4])
        call leds.bottom.left(event.args[2],event.args[3],event.args[4])
        call leds.bottom.right(event.args[2],event.args[3],event.args[4])
    end

onevent V_leds_off
   if event.args[0]==_id then
        emit ACK([_id,event.args[1]])
        call leds.top(0,0,0)
        call leds.bottom.left(0,0,0)
        call leds.bottom.right(0,0,0)
        call leds.circle(0,0,0,0,0,0,0,0)
        if event.args[2]==1 then
            call leds.prox.h(0,0,0,0,0,0,0,0)
            call leds.prox.v(0,0)
        end
    end

onevent A_sound_system
    if event.args[0]==_id  then
       emit ACK([_id,event.args[1]])
       if soundStatus == 0  then
            call sound.system(event.args[2])
            soundStatus = 1
            timer.period[0] = 500
       end
    end

onevent A_sound_freq
    if event.args[0]==_id then
        emit ACK([_id,event.args[1]])
         if soundStatus == 0  then
            call sound.freq(event.args[2],event.args[3])
            soundStatus = 1
            timer.period[0] = 500
        end
    end

onevent A_sound_play
    if event.args[0]==_id then
        emit ACK([_id,event.args[1]])
        if soundStatus  == 0 then
            call sound.play(event.args[2])
            soundStatus = 1
            timer.period[0] = 500
        end
    end

onevent A_sound_record
    if event.args[0]==_id then
        emit ACK([_id,event.args[1]])
        call sound.record(event.args[2])
    end

onevent A_sound_replay
        if event.args[0]==_id then
        emit ACK([_id,event.args[1]])
        if soundStatus == 0 then
            call sound.replay(event.args[2])
            soundStatus = 1
            timer.period[0] = 500
        end
    end

onevent M_motor_left
    if event.args[0]==_id then
        emit ACK([_id,event.args[1]])
        motor.left.target = event.args[2]
    end

onevent M_motor_right
    if event.args[0]==_id then
        emit ACK([_id,event.args[1]])
        motor.right.target = event.args[2]
    end

onevent M_motors
    if event.args[0]==_id then
        emit ACK([_id,event.args[1]])
        motor.left.target = event.args[2]
        motor.right.target = event.args[3]
    end

onevent prox
    # *******************************
    # Emit Proximity sensors
    # params Emit: _id, prox_horizontal, distance_front, distance_back, angle_front, angle_back, angle_ground
    # _id: id of the robot
    # prox_horizontal: normalized value of proximity sensors (0-4)
    # distance_front: distance of the front sensor (mm) (0-190)
    # distance_back: distance of the back sensor (mm) (0-125)
    # angle_front: angle of the front sensor (degrees) (-180-180)
    # angle_back: angle of the back sensor (degrees) (-180-180)
    # angle_ground: angle of the ground sensor (degrees) (-180-180)
    # *******************************
    changed = 0

    # Copie and normalize the values of the proximity sensors in the range [0, 4]
    for i in 0:6 do
        # Aumenta la precisión de la normalización
        call math.muldiv(tempValue, prox.horizontal[i], normalizedMax, H_minMaxValue)

        # Limita el valor a un máximo de 4
        if tempValue > 4 * H_scaleFactor then
            tempValue = 4 * H_scaleFactor
        end

        prox_horizontal[i] = tempValue / H_scaleFactor

        # Comprueba si hay cambios en el sensor de proximidad
        if prox_horizontal[i] != prox_horizontal_prev[i] then
            changed = 1
        end
        prox_horizontal_prev[i] = prox_horizontal[i]
    end

    # if there is a change in the proximity sensors, emit the event
    if changed == 1 then
        # Calcula 'angle.ground', 'angle.front' y 'angle.back'
        call math.dot(angle_ground, prox.ground.delta,[-4,4],7)
        call math.dot(angle_back, prox.horizontal,[0,0,0,0,0,4,-4],9)
        call math.dot(angle_front, prox.horizontal,[-4,-3,0,3,4,0,0],9)

        # Calcula 'distance.back'
        call math.max(distance_back, prox.horizontal[5],prox.horizontal[6])
        call math.muldiv(distance_back, distance_back, 267,10000)
        call math.clamp(distance_back,125-distance_back,0,125)
        distance_back = (distance_back / 10) * 10

        # Calcula 'distance.front'
        call math.dot(distance.front, prox.horizontal,[13,26,39,26,13,0,0],11)
        call math.clamp(distance.front,190-distance.front,0,190)
        distance_front = distance.front

        emit Prox([_id, prox_horizontal, distance_front, distance_back, angle_front, angle_back,  angle_ground])
    end

    # *******************************
    # Emit Ground sensors
    # params Emit: _id, groundSensorLeft, groundSensorRight
    # _id: id of the robot
    # groundSensorLeft: normalized value of the left ground sensor (0-4)
    # groundSensorRight: normalized value of the right ground sensor (0-4)
    # *******************************
    changed = 0

    # Increases the accuracy of normalisation
    call math.muldiv(groundSensorLeftNormalized, prox.ground.delta[0], normalizedMax, G_minMaxValue)
    call math.muldiv(groundSensorRightNormalized, prox.ground.delta[1], normalizedMax, G_minMaxValue)

    # Limits the SensorLef value to a maximum of 4
    if groundSensorLeftNormalized > 4 * G_scaleFactor then
      groundSensorLeftNormalized = 4 * G_scaleFactor
    end

    # Limits the SensorRight value to a maximum of 4
    if groundSensorRightNormalized > 4 * G_scaleFactor then
        groundSensorRightNormalized = 4 * G_scaleFactor
    end

    # Normalizes the values
    groundSensorLeftNormalized = groundSensorLeftNormalized / G_scaleFactor
    groundSensorRightNormalized = groundSensorRightNormalized / G_scaleFactor

    # Checks if there are changes in the ground sensor, if so, emit the event Ground
    if groundSensorLeftNormalized != groundSensorLeftPrev or groundSensorRightNormalized != groundSensorRightPrev then
        changed = 1
        emit Ground([_id, groundSensorLeftNormalized, groundSensorRightNormalized])
        groundSensorLeftPrev = groundSensorLeftNormalized
        groundSensorRightPrev = groundSensorRightNormalized
    end

onevent Q_add_motion
    if event.args[0]==_id then
        emit ACK([_id,event.args[1]])
        tmp[0:3] = event.args[2:5]
        callsub motion_add
    end

onevent Q_cancel_motion
    tmp[0] = event.args[0]
    callsub motion_cancel

sub motion_add
    if (Qnx != Qpc or (Qnx == Qpc and Qtime[Qpc] == 0)) and Qid[0]!=tmp[0] and Qid[1]!=tmp[0] and Qid[2]!=tmp[0] and Qid[3]!=tmp[0] then
        Qid[Qnx]   = tmp[0]
        Qtime[Qnx] = tmp[1]
        QspL[Qnx]  = tmp[2]
        QspR[Qnx]  = tmp[3]
        Qva = Qnx
        Qnx = (Qnx+1)%4
    end
    emit Q_motion_added([Qid[Qva], Qtime[Qva], QspL[Qva], QspR[Qva], Qva])


sub motion_cancel
    for tmp[1] in 1:4 do
        if Qid[tmp[1]-1] == tmp[0] then
        emit Q_motion_cancelled([Qid[tmp[1]-1], Qtime[tmp[1]-1], QspL[tmp[1]-1], QspR[tmp[1]-1], tmp[1]-1])
        Qtime[tmp[1]-1] = -1
        end
    end

onevent motor
    odo.delta = (motor.right.target + motor.left.target) / 2
    call math.muldiv(tmp[0], (motor.left.target - motor.right.target), 3695, 10000)
    odo.theta += tmp[0]
    call math.cos(tmp[0:1],[odo.theta,16384-odo.theta])
    call math.muldiv(tmp[0:1], [odo.delta,odo.delta],tmp[0:1], [32767,32767])
    odo.x += tmp[0]/10
    odo.y += tmp[1]/10
    call math.muldiv(odo.degree,odo.theta,90,16384)

    deltaX = odo.x - prevOdoX
    deltaY = odo.y - prevOdoY

    # check if the robot has moved more than 50 unitMotor or rotated more than 50 unitMotor
    if (deltaX > 50 or deltaX < -50) or (deltaY > 50 or deltaY < -50) or odo.degree != prevOdoDegree then
        emit Odometer([_id, odo.x, odo.y, odo.degree])
        prevOdoX = odo.x
        prevOdoY = odo.y
        prevOdoDegree = odo.degree
    end

    if Qtime[Qpc] > 0 then
      #emit Q_motion_started([Qid[Qpc], Qtime[Qpc], QspL[Qpc], QspR[Qpc], Qpc])
      Qtime[Qpc] = 0 - Qtime[Qpc]
    end
    if Qtime[Qpc] < 0 then
      motor.left.target = QspL[Qpc]
      motor.right.target = QspR[Qpc]
      Qtime[Qpc] += 1
      if Qtime[Qpc] == 0 then
        #emit Q_motion_ended([Qid[Qpc], Qtime[Qpc], QspL[Qpc], QspR[Qpc], Qpc])
        #Qid[Qpc] = 0
        Qpc = (Qpc+1)%4

        if Qtime[Qpc] == 0 and Qpc == Qnx then
          emit Q_motion_noneleft([Qpc])
          motor.left.target = 0
          motor.right.target = 0
        end
      end
    end
    if Qtime[Qpc] == 0 and Qpc != Qnx then
      Qpc = (Qpc+1)%4
    end
    call math.fill(tmp,0)
    tmp[Qnx]=1
    tmp[Qpc]=4

onevent timer0
    soundStatus = 0
    timer.period[0] = 0

onevent timer1
    emit A_noise_detect([_id, 0])
    timer.period[1] = 0
    micIntensity_prev = 0
`;
